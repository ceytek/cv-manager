import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from app.core.config import settings
from typing import Optional

try:
    from mailtrap import MailtrapClient, Mail, Address
except Exception:
    MailtrapClient = None
    Mail = None
    Address = None


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using Mailtrap API if configured; otherwise SMTP."""
    # Prefer Mailtrap API if token is present and SDK available
    token: Optional[str] = getattr(settings, 'MAILTRAP_API_TOKEN', None)
    if token and MailtrapClient and Mail and Address:
        try:
            client = MailtrapClient(token=token)
            mail = Mail(
                sender=Address(email=settings.MAIL_FROM, name=settings.MAIL_FROM_NAME),
                to=[Address(email=to_email)],
                subject=subject,
                html=html_content,
                category="Password Reset",
            )
            client.send(mail)
            return True
        except Exception as e:
            print(f"Mailtrap API send error: {e}. Falling back to SMTP...")
            # Fall through to SMTP

    # SMTP fallback
        smtp_user = settings.MAIL_USERNAME
        smtp_pass = settings.MAIL_PASSWORD

        if smtp_user and smtp_pass:
            # SMTP path (preferred when creds provided)
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
            message["To"] = to_email

            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

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
                return True
            except Exception as e:
                print(f"Email send error (SMTP): {e}")
                # fall back to API below

        # API path (optional)
        token: Optional[str] = getattr(settings, 'MAILTRAP_API_TOKEN', None)
        if token and MailtrapClient and Mail and Address:
            try:
                client = MailtrapClient(token=token)
                mail = Mail(
                    sender=Address(email=settings.MAIL_FROM, name=settings.MAIL_FROM_NAME),
                    to=[Address(email=to_email)],
                    subject=subject,
                    html=html_content,
                    category="Password Reset",
                )
                client.send(mail)
                return True
            except Exception as e:
                print(f"Mailtrap API send error: {e}")


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
