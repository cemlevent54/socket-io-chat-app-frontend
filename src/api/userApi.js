const API_BASE_URL = 'http://localhost:3000/api';

class UserApi {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Kullanıcı listesini getir
  async getUsers() {
    return this.makeRequest('/users');
  }

  // Kullanıcı login
  async login(email, password) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    console.log(response);
    return response;
  }

  // Tüm kullanıcıları getir (userController'a uygun şekilde)
  async getAllUsers(role = 'user') {
    if (role === 'admin') {
      // Admin ise iki endpointten veri çekip birleştir
      const [usersRes, providersRes] = await Promise.all([
        this.makeRequest('/admin/user/all'),
        this.makeRequest('/admin/provider/all')
      ]);
      // Sonuçları birleştirip tek bir array olarak döndür
      return { data: [...(usersRes.data || []), ...(providersRes.data || [])] };
    } else {
      return this.makeRequest('/providers');
    }
  }
}

export default new UserApi(); 