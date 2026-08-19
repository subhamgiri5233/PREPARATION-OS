// src/pages/Notifications.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Play, Calendar, Clock, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { getAllNotifications, markNotificationRead, markAllNotificationsRead, addNotification, updateNotification } from '../services/db';
import { snoozeReminder, dismissReminder } from '../services/reminderScheduler';
import { useAppStore } from '../store/useAppStore';

const NOTIF_ICONS = {
  'study-reminder': '⏰',
  'missed-session': '⚠️',
  revision: '🔄',
  session: '⏱️',
  mock: '📝',
  vocabulary: '📖',
  deadline: '⚠️',
  daily: '📊',
  system: '🔔',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { setUnreadCount } = useAppStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const notifs = await getAllNotifications();
    setNotifications(notifs);
    const unread = notifs.filter((n) => !n.read && !n.dismissed).length;
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

  const handleSnooze = async (notifId) => {
    await snoozeReminder(notifId, 5);
    loadNotifications();
  };

  const handleDismiss = async (notifId) => {
    await dismissReminder(notifId);
    loadNotifications();
  };

  const handleStartStudy = (notif) => {
    const actionData = notif.actionData || {};
    const params = new URLSearchParams();
    if (actionData.topicId) params.set('topicId', actionData.topicId);
    if (actionData.subjectId) params.set('subjectId', actionData.subjectId);
    if (actionData.preparationAreaId) params.set('areaId', actionData.preparationAreaId);
    
    // Mark notification read
    markNotificationRead(notif.id).catch(() => {});
    navigate(`/sessions?${params.toString()}`);
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

  const unreadCount = notifications.filter((n) => !n.read && !n.dismissed).length;

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
              Notifications are generated for pre-study reminders, missed sessions, revision due, vocabulary targets, and more.
              They appear here automatically as you use the app.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((notif) => {
            const isPreStudy = notif.type === 'study-reminder';
            const isMissed = notif.type === 'missed-session';

            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px 18px', borderRadius: 'var(--radius-lg)',
                  background: notif.read ? 'var(--card)' : 'var(--primary-glass)',
                  border: `1px solid ${notif.read ? 'var(--border)' : isMissed ? 'var(--danger)' : 'var(--border-accent)'}`,
                  transition: 'var(--transition)',
                  opacity: notif.dismissed ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>
                  {NOTIF_ICONS[notif.type] || '🔔'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{notif.title}</span>
                    {!notif.read && !notif.dismissed && <span className="badge badge-primary" style={{ fontSize: 9 }}>NEW</span>}
                    {notif.status === 'snoozed' && <span className="badge badge-warning" style={{ fontSize: 9 }}>Snoozed</span>}
                    {notif.dismissed && <span className="badge badge-muted" style={{ fontSize: 9 }}>Dismissed</span>}
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                    {notif.message}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, display: 'flex', gap: 12 }}>
                    {notif.scheduledAt && <span>{format(new Date(notif.scheduledAt), 'MMM d, h:mm a')}</span>}
                    {notif.scheduledTime && <span>Scheduled: {notif.scheduledTime}</span>}
                  </div>

                  {/* Interactive Action Buttons for Pre-Study & Missed Study Reminders */}
                  {(isPreStudy || isMissed) && !notif.dismissed && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleStartStudy(notif)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Play size={12} /> {isMissed ? 'Start Now' : 'Start Study'}
                      </button>

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate('/planner')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Calendar size={12} /> View Plan
                      </button>

                      {isPreStudy && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleSnooze(notif.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <RotateCcw size={12} /> Snooze 5 Min
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleDismiss(notif.id)}
                        style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <X size={12} /> {isMissed ? 'Skip' : 'Dismiss'}
                      </button>
                    </div>
                  )}
                </div>

                {!notif.read && (
                  <button className="btn btn-xs btn-ghost" onClick={() => handleMarkRead(notif.id)} title="Mark as read">
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
