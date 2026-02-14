// UI Helper functions
class UI {
  static showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease-in-out;
      max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  static showError(message) {
    this.showNotification(message, 'error');
  }

  static showSuccess(message) {
    this.showNotification(message, 'success');
  }

  static showInfo(message) {
    this.showNotification(message, 'info');
  }

  static setLoading(element, isLoading) {
    if (isLoading) {
      element.disabled = true;
      element.style.opacity = '0.6';
      element.style.cursor = 'not-allowed';
    } else {
      element.disabled = false;
      element.style.opacity = '1';
      element.style.cursor = 'pointer';
    }
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static truncate(text, length = 150) {
    if (text.length > length) {
      return text.substring(0, length) + '...';
    }
    return text;
  }

  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static sanitizeHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}

// Auth Helper
class AuthHelper {
  static isLoggedIn() {
    return !!api.getToken();
  }

  static getCurrentUser() {
    return api.getCurrentUser();
  }

  static isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  static isWriter() {
    const user = this.getCurrentUser();
    return user && (user.role === 'writer' || user.role === 'admin');
  }

  static async logout() {
    api.clearToken();
    window.location.href = '/';
  }

  static updateUI() {
    const isLoggedIn = this.isLoggedIn();
    const user = this.getCurrentUser();

    // Update login/logout buttons
    const loginBtn = document.querySelector('[data-login-btn]');
    const userMenu = document.querySelector('[data-user-menu]');
    const writerLink = document.querySelector('[data-writer-link]');
    const adminLink = document.querySelector('[data-admin-link]');

    if (loginBtn) {
      loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    }

    if (userMenu) {
      userMenu.style.display = isLoggedIn ? 'flex' : 'none';
      if (isLoggedIn && user) {
        userMenu.querySelector('[data-user-name]').textContent = user.username;
      }
    }

    if (writerLink) {
      writerLink.style.display = this.isWriter() ? 'block' : 'none';
    }

    if (adminLink) {
      adminLink.style.display = this.isAdmin() ? 'block' : 'none';
    }

    // Show/hide comment form
    const commentForm = document.querySelector('[data-comment-form]');
    if (commentForm) {
      commentForm.style.display = isLoggedIn ? 'block' : 'none';
    }

    const loginPrompt = document.querySelector('[data-login-prompt]');
    if (loginPrompt) {
      loginPrompt.style.display = isLoggedIn ? 'none' : 'block';
    }
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
