// src/pages/Notifications.jsx
// Automatically marks notifications as read/seen on visit, supports single/all delete, and real push notification permission

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, Play, Calendar, Clock, X, RotateCcw, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  getAllNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications, addNotification
} from '../services/db';
import {
  isNotificationSupported, getNotificationPermission,
  requestNotificationPermission, sendNativeNotification
} from '../services/nativeNotificationService';
import { snoozeReminder, dismissReminder } from '../services/reminderScheduler';
import { useAppStore } from '../store/useAppStore';
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

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
  const [permissionState, setPermissionState] = useState(getNotificationPermission());

  useEffect(() => {
    // When the user opens the notifications page (SEEN), automatically mark all unread as read/seen if allowed!
    const initAndMarkSeen = async () => {
      try {
        const notifs = await getAllNotifications();
        const hasUnread = (notifs || []).some((n) => !n.read && !n.dismissed);

        if (hasUnread && canEdit()) {
          await markAllNotificationsRead().catch(() => {});
          // Mark all in-memory as read
          const updated = (notifs || []).map((n) => ({ ...n, read: true }));
          setNotifications(updated);
        } else {
          setNotifications(notifs || []);
        }
        if (canEdit()) setUnreadCount(0);
      } catch (err) {
        console.error('[Notifications] Error initializing seen status:', err);
      }
    };

    initAndMarkSeen();
    setPermissionState(getNotificationPermission());
  }, [setUnreadCount]);

  const loadNotifications = async () => {
    try {
      const notifs = await getAllNotifications();
      setNotifications(notifs || []);
      const unread = (notifs || []).filter((n) => !n.read && !n.dismissed).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('[Notifications] Error loading:', err);
    }
  };

  const handleMarkRead = async (id) => {
    if (!canEdit()) {
      requireEditPermission('mark notification read');
      return;
    }
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!canEdit()) {
      requireEditPermission('mark all notifications read');
      return;
    }
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit()) {
      requireEditPermission('delete notification');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
      await loadNotifications();
    } catch (err) {
      alert('Failed to delete notification: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!canEdit()) {
      requireEditPermission('clear all notifications');
      return;
    }
    if (!window.confirm('Are you sure you want to delete ALL notifications?')) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      alert('Failed to clear notifications: ' + err.message);
    }
  };

  const handleSnooze = async (notifId) => {
    if (!canEdit()) {
      requireEditPermission('snooze reminder');
      return;
    }
    await snoozeReminder(notifId, 5);
    await loadNotifications();
  };

  const handleDismiss = async (notifId) => {
    if (!canEdit()) {
      requireEditPermission('dismiss reminder');
      return;
    }
    await dismissReminder(notifId);
    await loadNotifications();
  };

  const handleStartStudy = async (notif) => {
    const actionData = notif.actionData || {};
    const params = new URLSearchParams();
    if (actionData.topicId) params.set('topicId', actionData.topicId);
    if (actionData.subjectId) params.set('subjectId', actionData.subjectId);
    if (actionData.preparationAreaId) params.set('areaId', actionData.preparationAreaId);

    // Mark notification read/seen
    await markNotificationRead(notif.id || notif._id).catch(() => {});
    navigate(`/sessions?${params.toString()}`);
  };

  // Request browser notification permission with instant user feedback
  const handleEnablePush = async () => {
    if (!isNotificationSupported()) {
      alert('Device notifications are not supported in this browser.');
      return;
    }

    try {
      const result = await requestNotificationPermission();
      setPermissionState(result);

      if (result === 'granted') {
        await sendNativeNotification({
          title: '🎯 PrepOS Notifications Active!',
          body: 'You will receive real-time study reminders, revision alerts, and session notices.',
          url: '/notifications',
        });
        await addNotification({
          type: 'system',
          title: 'Real Device Notifications Enabled',
          message: 'Real push alerts are active on this device.',
          scheduledAt: new Date().toISOString(),
          idempotencyKey: 'notifications-enabled-' + Date.now(),
        });
        await loadNotifications();
        alert('✅ Device push notifications have been successfully enabled!');
      } else if (result === 'denied') {
        alert(
          '⚠️ Notification permission was blocked.\n\nPlease click the lock or site settings icon in your browser address bar and set Notifications to "Allow", then try again.'
        );
      }
    } catch (err) {
      console.error('[Notifications] Permission error:', err);
      alert('Error enabling notifications: ' + err.message);
    }
  };

  const handleTestNotification = async () => {
    const perm = getNotificationPermission();
    if (perm !== 'granted') {
      await handleEnablePush();
      return;
    }

    const sent = await sendNativeNotification({
      title: '⚡ PrepOS Study Alert',
      body: 'Great job staying consistent! Spaced repetition revision is ready.',
      url: '/revision',
    });

    if (sent) {
      alert('🔔 Test notification sent to your device!');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read && !n.dismissed).length;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 className="page-title">Notifications & Device Alerts</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications marked as seen ✓'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleTestNotification}>
            <Bell size={14} /> Test Device Alert
          </button>

          {permissionState !== 'granted' ? (
            <button className="btn btn-ghost" onClick={handleEnablePush}>
              <ShieldCheck size={14} /> Enable Real Push Alerts
            </button>
          ) : (
            <span className="badge badge-success" style={{ fontSize: 11, padding: '6px 10px' }}>
              ✓ Alerts Enabled
            </span>
          )}

          <button className="btn btn-ghost" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Mark All Read (Seen)
          </button>

          {notifications.length > 0 && (
            <button className="btn btn-ghost" onClick={handleClearAll} style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} /> Delete All
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">
              Notifications are generated for pre-study reminders, missed sessions, revision due, and vocabulary targets.
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
                key={notif.id || notif._id}
                style={{
                  display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
                  padding: '14px 16px', borderRadius: 'var(--radius-lg)',
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
                    {notif.read ? (
                      <span className="badge badge-muted" style={{ fontSize: 9 }}>SEEN</span>
                    ) : (
                      <span className="badge badge-primary" style={{ fontSize: 9 }}>NEW</span>
                    )}
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
                          onClick={() => handleSnooze(notif.id || notif._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <RotateCcw size={12} /> Snooze 5 Min
                        </button>
                      )}

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleDismiss(notif.id || notif._id)}
                        style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <X size={12} /> {isMissed ? 'Skip' : 'Dismiss'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!notif.read && (
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => handleMarkRead(notif.id || notif._id)}
                      title="Mark as read"
                    >
                      Mark Seen
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-ghost btn-icon"
                    onClick={() => handleDelete(notif.id || notif._id)}
                    title="Delete Notification"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
