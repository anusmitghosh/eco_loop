// EcoLoop Client API Client
const API_BASE = '';

export const API = {
  getToken() {
    return localStorage.getItem('ecoloop_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('ecoloop_token', token);
    } else {
      localStorage.removeItem('ecoloop_token');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  signup(userData) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getMe() {
    return this.request('/api/auth/me');
  },

  switchRole(newRole) {
    return this.request('/api/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ new_role: newRole })
    });
  },

  demoSwitch(demoRole) {
    return this.request('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ demo_role: demoRole })
    });
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' }).finally(() => {
      this.setToken(null);
    });
  },

  // Listings
  getListings(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    return this.request(`/api/listings?${qs.toString()}`);
  },

  getCategories() {
    return this.request('/api/listings/categories');
  },

  getListingDetail(id) {
    return this.request(`/api/listings/${id}`);
  },

  createListing(listingData) {
    return this.request('/api/listings', {
      method: 'POST',
      body: JSON.stringify(listingData)
    });
  },

  // Purchase Requests & Negotiation
  createPurchaseRequest(reqData) {
    return this.request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });
  },

  getRequests() {
    return this.request('/api/requests');
  },

  getConversation(convId) {
    return this.request(`/api/requests/conversation/${convId}`);
  },

  sendMessage(convId, content, messageType = 'text', metadata = null) {
    return this.request(`/api/requests/conversation/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, message_type: messageType, metadata })
    });
  },

  handleOfferAction(convId, action, options = {}) {
    return this.request(`/api/requests/conversation/${convId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, ...options })
    });
  },

  // Orders & Payment
  createOrder(orderData) {
    return this.request('/api/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  getOrders(status = 'all') {
    return this.request(`/api/orders?status=${status}`);
  },

  getOrderDetail(orderId) {
    return this.request(`/api/orders/${orderId}`);
  },

  processPayment(orderId, paymentMethod, vpaOrCard = null) {
    return this.request(`/api/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod, vpa_or_card: vpaOrCard })
    });
  },

  openDispute(orderId, reason, description, evidenceUrls = null) {
    return this.request(`/api/orders/${orderId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, description, evidence_urls: evidenceUrls })
    });
  },

  // Logistics & Live Tracking
  getLogisticsJobs() {
    return this.request('/api/logistics/jobs');
  },

  trackShipment(trackingId) {
    return this.request(`/api/logistics/track/${trackingId}`);
  },

  verifyPickup(trackingId, pickupOtp, lat = null, lng = null) {
    return this.request('/api/logistics/verify-pickup', {
      method: 'POST',
      body: JSON.stringify({ tracking_id: trackingId, pickup_otp: pickupOtp, driver_lat: lat, driver_lng: lng })
    });
  },

  verifyDelivery(trackingId, deliveryOtp, digitalSignature = null, lat = null, lng = null) {
    return this.request('/api/logistics/verify-delivery', {
      method: 'POST',
      body: JSON.stringify({ tracking_id: trackingId, delivery_otp: deliveryOtp, digital_signature: digitalSignature, driver_lat: lat, driver_lng: lng })
    });
  },

  updateDriverLocation(trackingId, lat, lng, speed = 30.0, heading = 0.0, statusLabel = 'En route', advanceStage = null) {
    return this.request('/api/logistics/update-location', {
      method: 'POST',
      body: JSON.stringify({ tracking_id: trackingId, lat, lng, speed_kmh: speed, heading, status_label: statusLabel, advance_stage: advanceStage })
    });
  },

  // Privacy & Compliance
  getPrivacySettings() {
    return this.request('/api/privacy/settings');
  },

  updatePrivacySettings(settings) {
    return this.request('/api/privacy/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  getLocationAuditHistory() {
    return this.request('/api/privacy/audit-history');
  },

  exportUserData() {
    return this.request('/api/privacy/export-data');
  },

  // Impact
  getImpactSummary() {
    return this.request('/api/impact/summary');
  },

  getImpactCertificate(orderNumber) {
    return this.request(`/api/impact/certificate/${orderNumber}`);
  },

  // Notifications
  getNotifications() {
    return this.request('/api/notifications');
  },

  markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  markAllNotificationsRead() {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  },

  // Admin
  getAdminMetrics() {
    return this.request('/api/admin/metrics');
  },

  getAdminBusinesses() {
    return this.request('/api/admin/businesses');
  },

  reviewBusinessVerification(bizId, action, notes = '') {
    return this.request(`/api/admin/businesses/${bizId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    });
  },

  getAdminDisputes() {
    return this.request('/api/admin/disputes');
  },

  resolveDispute(disputeId, action, notes) {
    return this.request(`/api/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, resolution_notes: notes })
    });
  },

  getAdminAuditLogs(action = '') {
    return this.request(`/api/admin/audit-logs${action ? `?action=${action}` : ''}`);
  },

  getAdminSecurityEvents() {
    return this.request('/api/admin/security-events');
  },

  toggleUserSuspension(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-suspend`, { method: 'POST' });
  },

  // Uploads
  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Direct Inventory Management
  getMyListings() {
    return this.request('/api/listings/user/my');
  },

  updateListing(id, data) {
    return this.request(`/api/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteListing(id) {
    return this.request(`/api/listings/${id}`, {
      method: 'DELETE'
    });
  },

  // Negotiation & Requests
  getRequest(id) {
    return this.request(`/api/requests/${id}`);
  },

  cancelRequest(id) {
    return this.request(`/api/requests/${id}/cancel`, {
      method: 'POST'
    });
  },

  // Orders, Invoices & Reviews
  getOrderInvoice(orderId) {
    return this.request(`/api/orders/${orderId}/invoice`);
  },

  submitOrderReview(orderId, rating, comment = '') {
    return this.request(`/api/orders/${orderId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },

  cancelOrder(orderId, reason = '') {
    return this.request(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Parametric Logistics Simulation
  simulateLogisticsStep(trackingId) {
    return this.request(`/api/logistics/simulate-step/${trackingId}`, {
      method: 'POST'
    });
  },

  // Business Profile & Security
  getProfile() {
    return this.request('/api/auth/profile');
  },

  updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  submitVerification(data) {
    return this.request('/api/auth/verify-business', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  toggle2FA() {
    return this.request('/api/auth/toggle-2fa', {
      method: 'POST'
    });
  },

  changePassword(oldPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
  },

  getSecuritySessions() {
    return this.request('/api/auth/security-sessions');
  },

  // Conversations & Messages
  getUserConversations() {
    return this.request('/api/requests/user/conversations');
  },

  // Disputes & Payment Methods
  getMyDisputes() {
    return this.request('/api/orders/disputes/my');
  },

  getPaymentMethods() {
    return this.request('/api/orders/payment/methods');
  }
};
