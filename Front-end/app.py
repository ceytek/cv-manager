import streamlit as st

# Sayfa yapılandırması
st.set_page_config(
    page_title="CV Değerlendirme Uygulaması",
    page_icon="📄",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Custom CSS ile tasarım
st.markdown("""
    <style>
    /* Ana sayfa arka planı */
    .main {
        background-color: #D1D5DB !important;
    }
    
    /* Streamlit container ayarları */
    .block-container {
        padding-top: 2rem !important;
        max-width: 650px !important;
    }
    
    /* Tüm Streamlit elementlerini gizle */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {visibility: hidden;}
    
    /* Input label düzenlemeleri */
    .stTextInput > label {
        font-size: 14px !important;
        color: #111827 !important;
        font-weight: 400 !important;
        margin-bottom: 8px !important;
    }
    
    /* Input alanları */
    .stTextInput input {
        background-color: #FFFFFF !important;
        border: 2px solid #6B7280 !important;
        border-radius: 8px !important;
        padding: 13px 16px !important;
        font-size: 15px !important;
        color: #111827 !important;
    }
    
    .stTextInput input::placeholder {
        color: #9CA3AF !important;
        font-size: 15px !important;
    }
    
    .stTextInput input:focus {
        border-color: #4B5563 !important;
        box-shadow: none !important;
        outline: none !important;
    }
    
    /* Button styling */
    .stButton > button {
        width: 100%;
        background-color: #0EA5E9 !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 14px !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        margin-top: 12px !important;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .stButton > button:hover {
        background-color: #0284C7 !important;
    }
    
    /* Forgot password link */
    .forgot-password {
        text-align: center;
        margin-top: 16px;
    }
    
    .forgot-password a {
        color: #0EA5E9;
        text-decoration: none;
        font-size: 14px;
        font-weight: 400;
    }
    
    .forgot-password a:hover {
        text-decoration: underline;
    }
    
    </style>
""", unsafe_allow_html=True)

# Session state initialization
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'login'

def login_page():
    """Giriş sayfası"""
    
    # Merkezi kolon
    col1, col2, col3 = st.columns([0.8, 2, 0.8])
    
    with col2:
        st.markdown("<div style='margin-top: 40px;'></div>", unsafe_allow_html=True)
        
        # Üstteki beyaz kutu (boş dekoratif alan)
        st.markdown("""
            <div style='
                background-color: white;
                height: 100px;
                border-radius: 10px 10px 0 0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            '></div>
        """, unsafe_allow_html=True)
        
        # Logo (beyaz kutunun altında ama üstte görünüyor)
        st.markdown("""
            <div style='text-align: center; margin-top: -50px; position: relative; z-index: 10;'>
                <div style='
                    width: 90px;
                    height: 90px;
                    background: linear-gradient(135deg, #2C7A7B 0%, #38B2AC 100%);
                    border-radius: 50%;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(44, 122, 123, 0.25);
                '>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        st.markdown("<div style='margin-top: 30px;'></div>", unsafe_allow_html=True)
        
        # Başlık
        st.markdown("""
            <h1 style='
                text-align: center;
                color: #1F2937;
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 40px;
                line-height: 1.3;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            '>CV Değerlendirme Uygulamasına Hoş Geldiniz</h1>
        """, unsafe_allow_html=True)
        
        # Form alanları
        username = st.text_input(
            "Kullanıcı adı", 
            placeholder="Kullanıcı adınızı giriniz",
            key="username_input"
        )
        
        password = st.text_input(
            "Şifre", 
            type="password",
            placeholder="Şifrenizi giriniz",
            key="password_input"
        )
        
        st.markdown("<div style='margin-top: 8px;'></div>", unsafe_allow_html=True)
        
        # Buton
        if st.button("Giriş Yap", key="login_button", use_container_width=True):
            if username and password:
                st.session_state.logged_in = True
                st.session_state.username = username
                st.session_state.current_page = 'dashboard'
                st.rerun()
            else:
                st.error("⚠️ Lütfen kullanıcı adı ve şifre giriniz!")
        
        # Şifremi unuttum
        st.markdown("""
            <div class='forgot-password'>
                <a href='#'>Şifremi Unuttum</a>
            </div>
        """, unsafe_allow_html=True)

def dashboard_page():
    """Ana dashboard sayfası (geçici)"""
    st.title("🎯 CV Değerlendirme Sistemi")
    st.write(f"Hoş geldiniz, **{st.session_state.username}**!")
    
    st.success("✅ Giriş başarılı! Dashboard sayfası yakında geliştirilecek...")
    
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Toplam CV", "0")
    with col2:
        st.metric("Aktif İlanlar", "0")
    with col3:
        st.metric("Eşleşmeler", "0")
    
    st.markdown("---")
    
    if st.button("🚪 Çıkış Yap"):
        st.session_state.logged_in = False
        st.session_state.current_page = 'login'
        st.rerun()

# Ana uygulama akışı
if st.session_state.current_page == 'login' and not st.session_state.logged_in:
    login_page()
elif st.session_state.logged_in:
    dashboard_page()
