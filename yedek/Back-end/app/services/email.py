import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from app.core.config import settings
from typing import Optional
import time
from collections import deque
import asyncio

# Duplicate send guards (in-memory)
_SENT_APPLICANT_CONFIRMATION = set()
_SENT_HR_NOTIFICATION = set()

# Simple in-memory rate limiter state
_EMAIL_SEND_TIMES = deque(maxlen=50)

try:
    from mailtrap import MailtrapClient, Mail, Address
except Exception:
    MailtrapClient = None
    Mail = None
    Address = None


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    *,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    smtp_username: Optional[str] = None,
    smtp_password: Optional[str] = None,
) -> bool:
    """Send email using Mailtrap API if configured; otherwise SMTP.
    Allows overriding sender identity and credentials per message.
    """
    # Prefer Mailtrap API if token is present and SDK available
    token: Optional[str] = getattr(settings, 'MAILTRAP_API_TOKEN', None)
    if token and MailtrapClient and Mail and Address:
        try:
            client = MailtrapClient(token=token)
            mail = Mail(
                sender=Address(email=from_email or settings.MAIL_FROM, name=from_name or settings.MAIL_FROM_NAME),
                to=[Address(email=to_email)],
                subject=subject,
                html=html_content,
                category="Transactional",
            )
            client.send(mail)
            return True
        except Exception as e:
            print(f"Mailtrap API send error: {e}. Falling back to SMTP...")

    # SMTP fallback
    smtp_user = smtp_username or settings.MAIL_USERNAME
    smtp_pass = smtp_password or settings.MAIL_PASSWORD

    if smtp_user and smtp_pass:
        # SMTP path (preferred when creds provided)
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{(from_name or settings.MAIL_FROM_NAME)} <{(from_email or settings.MAIL_FROM)}>"
        message["To"] = to_email

        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Rate limiting: enforce max emails per second
        now = time.time()
        # Prune timestamps older than 1 second
        while _EMAIL_SEND_TIMES and now - _EMAIL_SEND_TIMES[0] > 1.0:
            _EMAIL_SEND_TIMES.popleft()
        if len(_EMAIL_SEND_TIMES) >= settings.EMAIL_MAX_PER_SEC:
            # Delay until 1 second window passes
            sleep_time = 1.0 - (now - _EMAIL_SEND_TIMES[0])
            await asyncio.sleep(max(0.01, sleep_time))
        # Retry logic for 550 rate errors
        attempts = settings.EMAIL_RETRY_ATTEMPTS
        base_delay = settings.EMAIL_RETRY_BASE_DELAY_MS / 1000.0
    for attempt in range(1, attempts + 1):
            try:
                await aiosmtplib.send(
                    message,
                    hostname=settings.MAIL_SERVER,
                    port=settings.MAIL_PORT,
                    username=smtp_user,
                    password=smtp_pass,
                    use_tls=False,
                    start_tls=True,
                )
                _EMAIL_SEND_TIMES.append(time.time())
                return True
            except aiosmtplib.SMTPResponseException as smtp_err:
                # 550 too many emails per second
                code = getattr(smtp_err, 'code', None)
                msg = getattr(smtp_err, 'message', '')
                if code == 550 and 'Too many emails per second' in str(msg):
                    print("SMTP rate limit (550) encountered.")
                    if settings.EMAIL_DISABLE_RETRY_ON_550:
                        print("Retry disabled by configuration; aborting further attempts.")
                        break
                    if attempt < attempts:
                        delay = base_delay * (2 ** (attempt - 1))
                        print(f"Rate limit hit (attempt {attempt}/{attempts}). Backing off {delay:.2f}s...")
                        await asyncio.sleep(delay)
                        continue
                print(f"Email send error (SMTP attempt {attempt}): {smtp_err}")
                break
            except Exception as e:
                print(f"Email send error (SMTP attempt {attempt}): {e}")
                if attempt < attempts:
                    delay = base_delay * (2 ** (attempt - 1))
                    await asyncio.sleep(delay)
                    continue
                break

    # Optional: try Mailtrap API again as a last resort
    token2: Optional[str] = getattr(settings, 'MAILTRAP_API_TOKEN', None)
    if token2 and MailtrapClient and Mail and Address:
        try:
            client = MailtrapClient(token=token2)
            mail = Mail(
                sender=Address(email=from_email or settings.MAIL_FROM, name=from_name or settings.MAIL_FROM_NAME),
                to=[Address(email=to_email)],
                subject=subject,
                html=html_content,
                category="Transactional",
            )
            client.send(mail)
            return True
        except Exception as e:
            print(f"Mailtrap API send error (retry): {e}")

    return False


async def send_reset_password_email(to_email: str, reset_token: str, full_name: str):
    """Send password reset email"""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
            }
            .token {
                font-size: 32px;
                font-weight: bold;
                color: #3B82F6;
                text-align: center;
                padding: 20px;
                background-color: #EFF6FF;
                border-radius: 8px;
                letter-spacing: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>🔐 Şifre Sıfırlama</h2>
                <p>Merhaba {{ full_name }},</p>
                <p>Şifrenizi sıfırlamak için aşağıdaki 6 haneli kodu kullanın:</p>
                
                <div class="token">{{ reset_token }}</div>
                
                <p><strong>Bu kod 15 dakika geçerlidir.</strong></p>
                <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                
                <div class="footer">
                    <p>CV Manager - İnsan Kaynakları Yönetim Sistemi</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(full_name=full_name, reset_token=reset_token)
    
    subject = "Şifre Sıfırlama Kodu - CV Manager"
    return await send_email(to_email, subject, html_content)


async def send_welcome_email(to_email: str, full_name: str):
    """Send welcome email after registration"""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #3B82F6;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>🎉 Hoş Geldiniz!</h2>
                <p>Merhaba {{ full_name }},</p>
                <p>CV Manager ailesine katıldığınız için teşekkür ederiz!</p>
                <p>Artık sistemimizi kullanarak CV'leri değerlendirebilir ve iş ilanlarınızı yönetebilirsiniz.</p>
                
                <div class="footer">
                    <p>CV Manager - İnsan Kaynakları Yönetim Sistemi</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(full_name=full_name)
    
    subject = "Hoş Geldiniz - CV Manager"
    return await send_email(to_email, subject, html_content)


def send_application_notification_email(
    application_id: str,
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    match_score: Optional[int] = None
):
    """
    Send email notification to HR about new job application.
    
    Synchronous version for background tasks.
    """
    import asyncio
    
    # Prevent duplicate HR notifications for same application
    if application_id in _SENT_HR_NOTIFICATION:
        print(f"HR notification already sent for application {application_id}, skipping.")
        return
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
            }
            .info-box {
                background-color: #F3F4F6;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
            }
            .score {
                font-size: 48px;
                font-weight: bold;
                {% if match_score >= 80 %}color: #10B981;{% elif match_score >= 60 %}color: #F59E0B;{% else %}color: #EF4444;{% endif %}
                text-align: center;
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #3B82F6;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <h2>📄 Yeni Başvuru Alındı</h2>
                <p><strong>{{ job_title }}</strong> pozisyonuna yeni bir başvuru geldi.</p>
                
                <div class="info-box">
                    <p><strong>Aday Bilgileri:</strong></p>
                    <p>📧 İsim: {{ candidate_name }}</p>
                    <p>✉️ E-posta: {{ candidate_email }}</p>
                    <p>🆔 Başvuru ID: {{ application_id }}</p>
                </div>
                
                {% if match_score is not none %}
                <p><strong>Sistem Analizi:</strong></p>
                <div class="score">⭐ {{ match_score }}/100</div>
                <p style="text-align: center;">
                    {% if match_score >= 80 %}
                        <strong style="color: #10B981;">✅ Yüksek Uyumluluk</strong>
                    {% elif match_score >= 60 %}
                        <strong style="color: #F59E0B;">⚠️ Orta Uyumluluk</strong>
                    {% else %}
                        <strong style="color: #EF4444;">❌ Düşük Uyumluluk</strong>
                    {% endif %}
                </p>
                {% endif %}
                
                <div style="text-align: center;">
                    <a href="{{ settings.FRONTEND_URL }}" class="button" style="color: white;">
                        🔍 Başvuruyu İncele
                    </a>
                </div>
                
                <div class="footer">
                    <p>CV Manager - İnsan Kaynakları Yönetim Sistemi</p>
                    <p>Bu email otomatik olarak gönderilmiştir.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(
        application_id=application_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job_title,
        match_score=match_score,
        settings=settings
    )
    
    subject = f"Yeni Başvuru: {job_title} - {candidate_name}"
    
    # Get HR email from settings
    hr_email = getattr(settings, 'HR_EMAIL', settings.MAIL_FROM)
    
    # Run async function in sync context
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        success = loop.run_until_complete(
            send_email(
                hr_email,
                subject,
                html_content,
                from_email=(settings.MAIL_SENDER_HR or settings.MAIL_FROM),
                from_name=(settings.MAIL_SENDER_HR_NAME or settings.MAIL_FROM_NAME),
                smtp_username=(settings.MAIL_SENDER_HR_USER or settings.MAIL_USERNAME),
                smtp_password=(settings.MAIL_SENDER_HR_PASS or settings.MAIL_PASSWORD),
            )
        )
        if success:
            _SENT_HR_NOTIFICATION.add(application_id)
    finally:
        loop.close()


def send_application_confirmation_email(
    to_email: str,
    candidate_name: str,
    job_title: str
):
    """
    Send confirmation email to applicant after successful application.
    
    Synchronous version for background tasks.
    """
    import asyncio
    
    # Duplicate guard will be applied later using unique_key; remove invalid placeholder.
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
            }
            .success-icon {
                text-align: center;
                font-size: 64px;
                margin: 20px 0;
            }
            .info-box {
                background-color: #EFF6FF;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border-left: 4px solid #3B82F6;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content">
                <div class="success-icon">✅</div>
                <h2 style="text-align: center;">Başvurunuz Alındı!</h2>
                
                <p>Sayın {{ candidate_name }},</p>
                <p><strong>{{ job_title }}</strong> pozisyonuna başvurunuz başarıyla alındı.</p>
                
                <div class="info-box">
                    <p><strong>📋 Sonraki Adımlar:</strong></p>
                    <ul>
                        <li>CV'niz insan kaynakları ekibimiz tarafından değerlendirilecektir</li>
                        <li>Uygun görülmeniz durumunda sizinle iletişime geçilecektir</li>
                        <li>Değerlendirme süreci 1-2 hafta sürebilir</li>
                    </ul>
                </div>
                
                <p>Başvurunuz için teşekkür ederiz. Bizimle ilgilendiğiniz için minnettarız!</p>
                
                <div class="footer">
                    <p>CV Manager - İnsan Kaynakları Yönetim Sistemi</p>
                    <p>Bu email otomatik olarak gönderilmiştir.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_content = template.render(
        candidate_name=candidate_name,
        job_title=job_title
    )
    
    subject = f"Başvurunuz Alındı - {job_title}"
    
    # Run async function in sync context
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        # Use candidate email + job_title as unique key (no application_id here in public flow context)
        unique_key = f"{to_email}:{job_title}" if to_email else job_title
        if unique_key in _SENT_APPLICANT_CONFIRMATION:
            print(f"Applicant confirmation already sent for {unique_key}, skipping.")
            return
        success = loop.run_until_complete(
            send_email(
                to_email,
                subject,
                html_content,
                from_email=(settings.MAIL_SENDER_APPLICANT or settings.MAIL_FROM),
                from_name=(settings.MAIL_SENDER_APPLICANT_NAME or settings.MAIL_FROM_NAME),
                smtp_username=(settings.MAIL_SENDER_APPLICANT_USER or settings.MAIL_USERNAME),
                smtp_password=(settings.MAIL_SENDER_APPLICANT_PASS or settings.MAIL_PASSWORD),
            )
        )
        if success:
            _SENT_APPLICANT_CONFIRMATION.add(unique_key)
    finally:
        loop.close()
