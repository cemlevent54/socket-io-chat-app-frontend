const API_BASE_URL = 'http://localhost:3000/api/messages';

class MessageApi {
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

  // Mesaj gönder
  async sendMessage(content, receiverId) {
    return this.makeRequest('/send', {
      method: 'POST',
      body: JSON.stringify({
        content,
        receiverId
      })
    });
  }

  // Kullanıcı chat'lerini getir
  async getUserChats() {
    return this.makeRequest('/chats');
  }

  // Chat mesajlarını getir
  async getChatMessages(chatId) {
    return this.makeRequest(`/chats/${chatId}/messages`);
  }

  // Chat katılımcılarını getir
  async getChatParticipants(chatId) {
    return this.makeRequest(`/chats/${chatId}/participants`);
  }

  // Admin: Kullanıcıya mesaj gönder
  async sendMessageToUser(userId, content) {
    return this.makeRequest(`/user/${userId}/send`, {
      method: 'POST',
      body: JSON.stringify({
        content
      })
    });
  }

  // Chat geçmişini yükle (pagination)
  async loadChatHistory(chatId, limit = 20, before = null) {
    let url = `/chats/${chatId}/history?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    return this.makeRequest(url);
  }

  // Admin: Kullanıcı mesajlarını getir
  async getUserChatMessages(userId, limit = 20, before = null) {
    let url = `/user/${userId}/messages?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    return this.makeRequest(url);
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId, chatId) {
    return this.makeRequest('/messages/read', {
      method: 'POST',
      body: JSON.stringify({ messageId, chatId })
    });
  }

  // API ile mesaj gönder (callback ile)
  async sendApiMessage({ content, receiverId, onSuccess, onError, onFinally, senderId }) {
    if (!content || !receiverId) {
      onError && onError('Mesaj ve alıcı ID gereklidir');
      onFinally && onFinally();
      return;
    }
    try {
      const result = await this.sendMessage(content, receiverId);
      onSuccess && onSuccess(result);
    } catch (error) {
      onError && onError(error.message);
    } finally {
      onFinally && onFinally();
    }
  }

  // Kullanıcı chat'lerini getir (callback ile)
  async fetchUserChats({ onSuccess, onError, onFinally }) {
    try {
      const result = await this.getUserChats();
      onSuccess && onSuccess(result);
    } catch (error) {
      onError && onError(error.message);
    } finally {
      onFinally && onFinally();
    }
  }

  // Chat mesajlarını getir (callback ile)
  async fetchChatMessages({ chatId, onSuccess, onError, onFinally }) {
    if (!chatId) {
      onError && onError('Chat ID gereklidir');
      onFinally && onFinally();
      return;
    }
    try {
      const result = await this.getChatMessages(chatId);
      onSuccess && onSuccess(result);
    } catch (error) {
      onError && onError(error.message);
    } finally {
      onFinally && onFinally();
    }
  }

  // Chat katılımcılarını getir (callback ile)
  async fetchChatParticipants({ chatId, onSuccess, onError, onFinally }) {
    if (!chatId) {
      onError && onError('Chat ID gereklidir');
      onFinally && onFinally();
      return;
    }
    try {
      const result = await this.getChatParticipants(chatId);
      onSuccess && onSuccess(result);
    } catch (error) {
      onError && onError(error.message);
    } finally {
      onFinally && onFinally();
    }
  }

  // Admin: Kullanıcıya mesaj gönder (callback ile)
  async sendMessageToUserApi({ userId, content, onSuccess, onError, onFinally }) {
    if (!content || !userId) {
      onError && onError('Mesaj ve kullanıcı ID gereklidir');
      onFinally && onFinally();
      return;
    }
    try {
      const result = await this.sendMessageToUser(userId, content);
      onSuccess && onSuccess(result);
    } catch (error) {
      onError && onError(error.message);
    } finally {
      onFinally && onFinally();
    }
  }

  // Admin: Tüm chatleri getir
  async getAdminChats() {
    return this.makeRequest('/admin/chats');
  }

  // Admin: Chat mesajlarını getir
  async getAdminChatMessages(chatId, params = {}) {
    let url = `/admin/chats/${chatId}/messages`;
    const query = [];
    if (params.before) query.push(`before=${encodeURIComponent(params.before)}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (query.length) url += '?' + query.join('&');
    return this.makeRequest(url);
  }

  // Admin: Mesaj gönder
  async sendAdminMessage(content, receiverId) {
    return this.makeRequest('/admin/chats/messages', {
      method: 'POST',
      body: JSON.stringify({ content, receiverId })
    });
  }
}

export default new MessageApi(); 