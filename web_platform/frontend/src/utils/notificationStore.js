// Global Notification Store with strict per-user isolation

function getActiveUserId() {
  try {
    const saved = localStorage.getItem('telemed_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u?.user_id) return u.user_id;
      if (u?.id) return u.id;
    }
  } catch (e) {}
  return 'default_user';
}

function getInitialNotificationsForUser(userId) {
  return [
    {
      id: `NOT-WELCOME-${userId || 'NEW'}`,
      category: 'Welcome',
      title: 'Welcome to TeleMed AI Patient Portal',
      description: 'Your patient workspace is initialized. Complete your first intake assessment to calculate personalized risk vectors and clinical guidelines.',
      details: 'Connected to TeleMed Precision AI v4.0. Multimodal clinical, wearable, and microbiome signals ready for intake.',
      timestamp: 'Just now',
      priority: 'HIGH',
      isRead: false,
      actionRoute: '/intake',
      actionLabel: 'Start Intake Assessment'
    }
  ];
}

export const notificationStore = {
  getNotifications(targetUserId) {
    const uid = targetUserId || getActiveUserId();
    const key = `telemed_notifications_${uid}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    
    const initial = getInitialNotificationsForUser(uid);
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  },

  getUnreadCount(targetUserId) {
    const list = this.getNotifications(targetUserId);
    return list.filter(n => !n.isRead).length;
  },

  markAsRead(id, targetUserId) {
    const uid = targetUserId || getActiveUserId();
    const key = `telemed_notifications_${uid}`;
    const list = this.getNotifications(uid);
    const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('telemed_notifications_updated'));
    return updated;
  },

  markAllAsRead(targetUserId) {
    const uid = targetUserId || getActiveUserId();
    const key = `telemed_notifications_${uid}`;
    const list = this.getNotifications(uid);
    const updated = list.map(n => ({ ...n, isRead: true }));
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('telemed_notifications_updated'));
    return updated;
  },

  deleteNotification(id, targetUserId) {
    const uid = targetUserId || getActiveUserId();
    const key = `telemed_notifications_${uid}`;
    const list = this.getNotifications(uid);
    const updated = list.filter(n => n.id !== id);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('telemed_notifications_updated'));
    return updated;
  }
};
