import client from '../apolloClient';
import { 
  LOGIN_MUTATION, 
  REGISTER_MUTATION, 
  ME_QUERY,
  FORGOT_PASSWORD_MUTATION,
  VERIFY_RESET_TOKEN_MUTATION,
  RESET_PASSWORD_MUTATION,
  CHANGE_PASSWORD_MUTATION,
} from '../graphql/auth';

class AuthService {
  // Login
  async login(email, password) {
    try {
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          input: {
            email,
            password,
          },
        },
      });

      const { accessToken, refreshToken } = data.login;
      
      // Token'ları kaydet
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      return data.login;
    } catch (error) {
      throw new Error(error.message || 'Giriş başarısız');
    }
  }

  // Register
  async register(email, password, fullName) {
    try {
      const { data } = await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: {
          input: {
            email,
            password,
            fullName,
          },
        },
      });

      const { accessToken, refreshToken } = data.register;
      
      // Token'ları kaydet
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      return data.register;
    } catch (error) {
      throw new Error(error.message || 'Kayıt başarısız');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data } = await client.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });

      return data.me;
    } catch (error) {
      throw new Error(error.message || 'Kullanıcı bilgisi alınamadı');
    }
  }

  // Forgot password - send reset code
  async forgotPassword(email) {
    try {
      const { data } = await client.mutate({
        mutation: FORGOT_PASSWORD_MUTATION,
        variables: { input: { email } },
      });
      return data.forgotPassword;
    } catch (error) {
      throw new Error(error.message || 'Şifre sıfırlama e-postası gönderilemedi');
    }
  }

  // Verify reset token (optional step)
  async verifyResetToken(email, token) {
    try {
      const { data } = await client.mutate({
        mutation: VERIFY_RESET_TOKEN_MUTATION,
        variables: { input: { email, token } },
      });
      return data.verifyResetToken;
    } catch (error) {
      throw new Error(error.message || 'Kod doğrulanamadı');
    }
  }

  // Reset password
  async resetPassword(email, token, newPassword) {
    try {
      const { data } = await client.mutate({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { input: { email, token, newPassword } },
      });
      return data.resetPassword;
    } catch (error) {
      throw new Error(error.message || 'Şifre sıfırlanamadı');
    }
  }

  // Change password (requires auth token)
  async changePassword(oldPassword, newPassword) {
    try {
      const { data } = await client.mutate({
        mutation: CHANGE_PASSWORD_MUTATION,
        variables: { input: { oldPassword, newPassword } },
      });
      return data.changePassword;
    } catch (error) {
      throw new Error(error.message || 'Şifre değiştirilemedi');
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    client.clearStore(); // Apollo cache'i temizle
  }

  // Check if logged in
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
}

export default new AuthService();
