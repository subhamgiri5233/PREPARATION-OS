// src/pages/Notifications.jsx
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getAllNotifications, markNotificationRead, markAllNotificationsRead, addNotification } from '../services/db';
import { useAppStore } from '../store/useAppStore';

const NOTIF_ICONS = {
  revision: '🔄',
  session: '⏱️',
  mock: '📝',
  vocabulary: '📖',
  deadline: '⚠️',
  daily: '📊',
  system: '🔔',
};

export default function Notifications() {
  const { setUnreadCount } = useAppStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const notifs = await getAllNotifications();
    setNotifications(notifs);
    const unread = notifs.filter((n) => !n.read).length;
    setUnreadCount(unread);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    loadNotifications();
  };

  // Request browser notification permission
  const requestPermission = async () => {
    const { requestNotificationPermission, sendNativeNotification } = await import('../services/nativeNotificationService');
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      await sendNativeNotification({
        title: '🎯 PrepOS Alerts Enabled!',
        body: 'Real device notifications are now active for study sessions, revisions, and targets.',
        url: '/notifications'
      });
      await addNotification({
        type: 'system',
        title: 'Real Device Notifications Enabled',
        message: 'You will now receive native alerts on this device.',
        scheduledAt: new Date().toISOString(),
        idempotencyKey: 'notifications-enabled'
      });
      loadNotifications();
    }
  };

  const handleTestNotification = async () => {
    const { sendNativeNotification } = await import('../services/nativeNotificationService');
    const sent = await sendNativeNotification({
      title: '⚡ PrepOS Study Reminder',
      body: 'Great job staying consistent! Spaced repetition revision is ready.',
      url: '/revision'
    });
    if (!sent) {
      requestPermission();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Notifications & Device Alerts</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleTestNotification}>
            <Bell size={14} /> Test Device Alert
          </button>
          {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
            <button className="btn btn-ghost" onClick={requestPermission}>
              Enable Real Push Alerts
            </button>
          )}
          {unreadCount > 0 && (
            <button className="btn btn-ghost" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">No notifications yet</div>
            <div className="empty-desc">
              Notifications are generated for revision due, session reminders, vocabulary targets, and more.
              They appear here automatically as you use the app.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                background: notif.read ? 'var(--card)' : 'var(--primary-glass)',
                border: `1px solid ${notif.read ? 'var(--border)' : 'var(--border-accent)'}`,
                transition: 'var(--transition)',
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0 }}>
                {NOTIF_ICONS[notif.type] || '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{notif.title}</span>
                  {!notif.read && <span className="badge badge-primary" style={{ fontSize: 9 }}>NEW</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{notif.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {notif.scheduledAt ? format(new Date(notif.scheduledAt), 'MMM d, h:mm a') : ''}
                </div>
              </div>
              {!notif.read && (
                <button className="btn btn-sm btn-ghost" onClick={() => handleMarkRead(notif.id)}>
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
