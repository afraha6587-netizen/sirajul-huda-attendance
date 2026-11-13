import React, { useEffect, useState } from 'react';
import { X, Calendar, UserCheck, Trash2, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface TeacherAttendanceModalProps {
  onClose: () => void;
}

export const TeacherAttendanceModal: React.FC<TeacherAttendanceModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [period, setPeriod] = useState<number | ''>('');
  const [status, setStatus] = useState<'ABSENT' | 'LEAVE'>('ABSENT');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/teachers'),
      api.get('/classes'),
      api.get('/teacher-attendance'),
    ])
      .then(([tRes, cRes, rRes]) => {
        const tList: any[] = tRes.data || [];
        setTeachers(tList);
        setClasses(cRes.data || []);
        setRecords(rRes.data || []);

        if (isAdmin) {
          if (tList.length > 0) {
            setSelectedTeacherId(tList[0].id);
          }
        } else {
          // Auto-select logged-in teacher
          const myProfile = tList.find(
            (t) => t.userId === user?.id || (t.user && t.user.email === user?.email)
          );
          if (myProfile) {
            setSelectedTeacherId(myProfile.id);
          } else if (tList.length > 0) {
            setSelectedTeacherId(tList[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAdmin, user]);

  const myTeacherProfile = teachers.find(
    (t) => t.userId === user?.id || (t.user && t.user.email === user?.email)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetTeacherId = isAdmin ? selectedTeacherId : (myTeacherProfile?.id || selectedTeacherId);
    if (!targetTeacherId || !date) {
      alert('Please select a teacher and date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        teacherId: targetTeacherId,
        date,
        classId: selectedClassId || null,
        period: period ? Number(period) : null,
        status,
        reason: reason.trim() || null,
      };

      const res = await api.post('/teacher-attendance', payload);
      setRecords([res.data, ...records]);
      setReason('');
      alert(
        isAdmin
          ? 'Teacher absence/leave logged successfully!'
          : 'Your absence/leave has been recorded successfully!'
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to log teacher attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this teacher attendance record?')) return;

    try {
      await api.delete(`/teacher-attendance/${id}`);
      setRecords(records.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {isAdmin ? 'Teacher Absence & Leave Log' : 'Log My Absence / Leave'}
              </h2>
              <p className="text-xs text-amber-200 font-semibold">
                {isAdmin
                  ? 'Super Admin: Record Usthad leaves. Automatically adjusts class sessions so students are not penalized.'
                  : 'Enter your absence or official leave for today or an upcoming date.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Absence Logging Form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
            <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>{isAdmin ? 'Log Teacher Absence or Partial Missed Period' : 'Enter My Absence Details'}</span>
              </div>
              {!isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  Teacher Self-Service
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isAdmin ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Select Teacher / Usthad
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">-- Select Usthad --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Teacher Name
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900">
                    {myTeacherProfile?.name || user?.name} ({myTeacherProfile?.code || 'Usthad'})
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Class (Optional if Full Day)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                >
                  <option value="">Full Day Leave (All Classes)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Period No (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="e.g. 1, 2, 3... (Leave empty for full day)"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                >
                  <option value="ABSENT">ABSENT</option>
                  <option value="LEAVE">OFFICIAL LEAVE</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal leave / Emergency / Health"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <span>{saving ? 'Saving...' : isAdmin ? 'Record Teacher Absence' : 'Submit My Absence'}</span>
              </button>
            </div>
          </form>

          {/* Absence Records Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>
                {isAdmin ? `All Teacher Absence Logs (${records.length})` : `My Absence History (${records.filter((r) => r.teacherId === myTeacherProfile?.id || r.createdById === user?.id).length})`}
              </span>
            </h3>

            {loading ? (
              <div className="py-8 text-center text-slate-400 font-bold text-xs animate-pulse">
                Loading teacher attendance logs...
              </div>
            ) : records.length > 0 ? (
              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {records
                  .filter((r) => isAdmin || r.teacherId === myTeacherProfile?.id || r.createdById === user?.id)
                  .map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{r.teacher?.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {r.status}
                          </span>
                          <span>•</span>
                          <span>Date: {r.date}</span>
                          <span>•</span>
                          <span>Scope: {r.class ? `Class ${r.class.name}` : 'Full Day'}</span>
                          {r.period && <span>(Period #{r.period})</span>}
                        </div>
                        {r.reason && <p className="text-[11px] text-slate-500 italic mt-1 font-medium">{r.reason}</p>}
                      </div>

                      {(isAdmin || r.createdById === user?.id) && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No teacher absence records found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
