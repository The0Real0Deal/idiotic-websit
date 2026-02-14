// API Client for blog system
class BlogAPI {
  constructor() {
    this.baseURL = '/api';
    this.token = this.getToken();
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
      this.token = token;
    }
  }

  clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.token = null;
  }

  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  // Auth endpoints
  async register(username, email, password, confirmPassword) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword })
    });

    this.setToken(result.token);
    this.setCurrentUser(result.user);
    return result;
  }

  async login(username, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    this.setToken(result.token);
    this.setCurrentUser(result.user);
    return result;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }

  // Post endpoints
  async getAllPosts() {
    return this.request('/posts');
  }

  async getPostById(id) {
    return this.request(`/posts/${id}`);
  }

  async getUserPosts(userId) {
    return this.request(`/posts/user/${userId}`);
  }

  async createPost(title, content, slug, description, category) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, slug, description, category })
    });
  }

  async updatePost(id, updates) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async publishPost(id) {
    return this.request(`/posts/${id}/publish`, {
      method: 'POST'
    });
  }

  async deletePost(id) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  }

  // Comment endpoints
  async getPostComments(postId) {
    return this.request(`/comments/post/${postId}`);
  }

  async createComment(postId, content) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, content })
    });
  }

  async approveComment(commentId) {
    return this.request(`/comments/${commentId}/approve`, {
      method: 'POST'
    });
  }

  async deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  // Admin endpoints
  async getUsers() {
    return this.request('/admin/users');
  }

  async assignWriterRole(userId) {
    return this.request(`/admin/users/${userId}/assign-writer`, {
      method: 'POST'
    });
  }

  async removeWriterRole(userId) {
    return this.request(`/admin/users/${userId}/remove-writer`, {
      method: 'POST'
    });
  }

  async getAllPostsAdmin() {
    return this.request('/admin/posts');
  }

  async getAllCommentsAdmin() {
    return this.request('/admin/comments');
  }

  async getPendingComments() {
    return this.request('/admin/comments/pending');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }
}

// Create global instance
const api = new BlogAPI();
