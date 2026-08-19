// src/pages/TeachingSchedule.jsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { getTeachingSchedule, addTeachingSlot, updateTeachingSlot, deleteTeachingSlot } from '../services/db';
import { useAppStore } from '../store/useAppStore';
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeachingSchedule() {
  const { setTeachingSchedule } = useAppStore();
  const [schedule, setSchedule] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '07:00', endTime: '08:00', label: 'Teaching' });

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    const s = await getTeachingSchedule();
    setSchedule(s);
    setTeachingSchedule(s);
  };

  const handleSave = async () => {
    if (!canEdit()) {
      requireEditPermission('save teaching slot');
      return;
    }
    if (editSlot) {
      await updateTeachingSlot(editSlot.id, form);
    } else {
      await addTeachingSlot(form);
    }
    setShowAdd(false);
    setEditSlot(null);
    setForm({ dayOfWeek: 1, startTime: '07:00', endTime: '08:00', label: 'Teaching' });
    loadSchedule();
  };

  const handleDelete = async (id) => {
    if (!canEdit()) {
      requireEditPermission('delete teaching slot');
      return;
    }
    await deleteTeachingSlot(id);
    loadSchedule();
  };

  // Group by day
  const byDay = DAY_NAMES.map((name, index) => ({
    name, index,
    slots: schedule.filter((s) => s.dayOfWeek === index),
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Teaching Schedule</h1>
          <p className="page-subtitle">Manage your teaching periods — these are blocked from study planning</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (!canEdit()) {
            requireEditPermission('add teaching slot');
            return;
          }
          setShowAdd(true);
        }}>
          <Plus size={14} /> Add Slot
        </button>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'var(--warning-glass)', border: '1px solid var(--warning)',
        borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 24,
        fontSize: 13, color: 'var(--warning)',
      }}>
        🏫 Teaching periods are automatically blocked in the Study Planner. You cannot schedule study during these times.
      </div>

      {/* Weekly Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
        {byDay.map(({ name, index, slots }) => (
          <div key={index} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 14, minHeight: 120,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: slots.length > 0 ? 'var(--warning)' : 'var(--text-2)' }}>
              {name.slice(0, 3)}
            </div>
            {slots.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>Free</div>
            ) : (
              slots.map((slot) => (
                <div key={slot.id} style={{
                  background: 'var(--warning-glass)', border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 8px', marginBottom: 6,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>{slot.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
                    {slot.startTime} – {slot.endTime}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-icon btn-ghost" style={{ width: 22, height: 22 }}
                      onClick={() => { setEditSlot(slot); setForm({ dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, label: slot.label }); setShowAdd(true); }}>
                      <Edit2 size={10} />
                    </button>
                    <button className="btn btn-icon btn-ghost" style={{ width: 22, height: 22, color: 'var(--danger)' }}
                      onClick={() => handleDelete(slot.id)}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              style={{ width: '100%', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)', fontSize: 10, cursor: 'pointer', marginTop: 4 }}
              onClick={() => { setForm({ ...form, dayOfWeek: index }); setShowAdd(true); }}
            >
              + Add
            </button>
          </div>
        ))}
      </div>

      {/* List view */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">📋 All Teaching Slots</div>
        </div>
        {schedule.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <div className="empty-title">No teaching slots</div>
            <div className="empty-desc">Add your teaching schedule to block those times in the planner</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Label</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((slot) => (
                  <tr key={slot.id}>
                    <td style={{ fontWeight: 600 }}>{DAY_NAMES[slot.dayOfWeek]}</td>
                    <td>{slot.label}</td>
                    <td>{slot.startTime}</td>
                    <td>{slot.endTime}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost"
                          onClick={() => { setEditSlot(slot); setForm({ dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, label: slot.label }); setShowAdd(true); }}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(slot.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && (setShowAdd(false), setEditSlot(null))}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editSlot ? 'Edit Teaching Slot' : 'Add Teaching Slot'}</h2>
              <button className="modal-close" onClick={() => { setShowAdd(false); setEditSlot(null); }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-select" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Label</label>
                <input className="form-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Morning Teaching" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setEditSlot(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
