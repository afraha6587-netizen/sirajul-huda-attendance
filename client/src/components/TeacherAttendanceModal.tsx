import React, { useEffect, useState } from 'react';
import { X, Calendar, UserCheck, Trash2, Plus, AlertCircle } from 'lucide-react';
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
        setTeachers(tRes.data);
        setClasses(cRes.data);
        setRecords(rRes.data);

        // Auto select current teacher if logged in user is teacher
        if (!isAdmin && tRes.data.length > 0) {
          const currentT = tRes.data.find((t: any) => t.user?.email === user?.email);
          if (currentT) setSelectedTeacherId(currentT.id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !date) {
      alert('Please select a teacher and date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        teacherId: selectedTeacherId,
        date,
        classId: selectedClassId || null,
        period: period ? Number(period) : null,
        status,
        reason: reason.trim() || null,
      };

      const res = await api.post('/teacher-attendance', payload);
      setRecords([res.data, ...records]);
      setReason('');
      alert('Teacher absence/leave logged successfully! Class working days/sessions updated.');
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
              <h2 className="text-lg font-black tracking-tight">Teacher Absence & Leave Log</h2>
              <p className="text-xs text-amber-200 font-semibold">
                Marking teacher absence automatically reduces class working sessions so students are not penalized
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
            <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Log Teacher Absence or Partial Period Missed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Select Teacher / Usthad
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  disabled={!isAdmin && teachers.some((t) => t.user?.email === user?.email)}
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

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                <input
                  type="date"
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
                  placeholder="e.g. 1, 2, 3..."
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
                  placeholder="e.g. Late arrival / Personal leave"
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
                <span>{saving ? 'Saving...' : 'Record Teacher Absence'}</span>
              </button>
            </div>
          </form>

          {/* Absence Records Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Teacher Absence Log History ({records.length})</span>
            </h3>

            {loading ? (
              <div className="py-8 text-center text-slate-400 font-bold text-xs animate-pulse">
                Loading teacher attendance logs...
              </div>
            ) : records.length > 0 ? (
              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {records.map((r) => (
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
                      {r.reason && <p className="text-[11px] text-slate-400 italic mt-1">{r.reason}</p>}
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
