// EcoLoop Global State Management
import { API } from './api.js';

export const State = {
  user: null,
  activeRole: 'buyer',
  unreadCount: 0,
  notifications: [],
  categories: [],
  subscribers: new Set(),

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },

  notify() {
    this.subscribers.forEach(cb => cb(this));
  },

  async init() {
    try {
      const catsRes = await API.getCategories();
      if (catsRes.success) {
        this.categories = catsRes.categories;
      }
    } catch (e) {
      console.warn("Could not preload categories:", e);
    }

    if (API.getToken()) {
      try {
        const meRes = await API.getMe();
        if (meRes.success) {
          this.user = meRes.user;
          this.activeRole = meRes.user.active_role || meRes.user.role;
          this.unreadCount = meRes.user.unread_notifications || 0;
        }
      } catch (err) {
        console.warn("Session check failed, clearing token:", err);
        API.setToken(null);
        this.user = null;
      }
    }
    this.notify();
  },

  setUser(user) {
    this.user = user;
    this.activeRole = user ? (user.active_role || user.role) : 'buyer';
    this.notify();
  },

  async switchRole(targetRole) {
    if (!this.user) return;
    try {
      const res = await API.switchRole(targetRole);
      if (res.success) {
        this.activeRole = res.active_role;
        this.user.active_role = res.active_role;
        this.notify();
        Toast.show(`Switched to ${targetRole.toUpperCase()} mode`, "success");
      }
    } catch (e) {
      Toast.show(e.message, "error");
    }
  },

  async demoSwitch(roleKey) {
    try {
      const res = await API.demoSwitch(roleKey);
      if (res.success) {
        API.setToken(res.token);
        this.user = res.user;
        this.activeRole = res.user.active_role || res.user.role;
        this.notify();
        Toast.show(`Logged in as Demo Persona: ${res.user.business?.business_name || res.user.full_name} (${this.activeRole.toUpperCase()})`, "success");
      }
    } catch (e) {
      Toast.show(e.message, "error");
    }
  },

  async logout() {
    try {
      await API.logout();
    } catch (e) {}
    this.user = null;
    this.activeRole = 'buyer';
    this.unreadCount = 0;
    this.notify();
    Toast.show("Logged out successfully", "info");
  }
};

export const Toast = {
  container: null,

  ensureContainer() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  },

  show(message, type = 'info', duration = 4000) {
    const container = this.ensureContainer();
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-4 opacity-0 ${
      type === 'success' ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700' :
      type === 'error' ? 'bg-rose-900/95 text-rose-100 border-rose-700' :
      type === 'warning' ? 'bg-amber-900/95 text-amber-100 border-amber-700' :
      'bg-slate-900/95 text-slate-100 border-slate-700'
    }`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `
      <span class="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 font-bold shrink-0">${icon}</span>
      <div class="flex-1">${message}</div>
      <button class="text-white/60 hover:text-white ml-2 text-base shrink-0">&times;</button>
    `;

    toast.querySelector('button').onclick = () => {
      toast.remove();
    };

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
