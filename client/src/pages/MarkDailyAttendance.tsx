import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Save, Sparkles, MessageSquare, AlertCircle, Lock } from 'lucide-react';
import api from '../utils/api';
import { Class, Student } from '../types';
import { Navbar } from '../components/Navbar';
import { useAcademic } from '../context/AcademicContext';
import { getHijriDateString } from '../utils/hijri';

export const MarkDailyAttendance: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAcademic();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Declared Class Leave / Holiday state
  const [declaredLeave, setDeclaredLeave] = useState<{ isLeave: boolean; reason?: string; message?: string } | null>(null);

  useEffect(() => {
    api.get('/classes').then((res) => {
      const classList = Array.isArray(res.data) ? res.data : [];
      setClasses(classList);
      if (classList.length > 0) setSelectedClassId(classList[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    setLoading(true);
    setSuccessMessage('');

    Promise.all([
      api.get('/students', { params: { classId: selectedClassId } }),
      api.get('/attendance/daily', { params: { classId: selectedClassId, date: selectedDate } }),
      api.get('/attendance/check-leave', { params: { classId: selectedClassId, date: selectedDate } }),
    ])
      .then(([studRes, dailyRes, leaveRes]) => {
        const list: Student[] = Array.isArray(studRes.data) ? studRes.data : studRes.data?.students || [];
        setStudents(list);

        if (leaveRes.data?.isLeave) {
          setDeclaredLeave(leaveRes.data);
        } else {
          setDeclaredLeave(null);
        }

        const savedDaily: any[] = Array.isArray(dailyRes.data) ? dailyRes.data : [];
        const savedMap: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
        savedDaily.forEach((d) => {
          savedMap[d.studentId] = d.status as any;
        });

        const initial: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
        list.forEach((s) => {
          initial[s.id] = savedMap[s.id] || 'PRESENT';
        });
        setAttendanceState(initial);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassId, selectedDate]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    if (declaredLeave?.isLeave) {
      alert(
        `Attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedClass?.name} because of: "${declaredLeave.reason}".`
      );
      return;
    }
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const handleToggle = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    if (declaredLeave?.isLeave) {
      alert(
        `Attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedClass?.name} because of: "${declaredLeave.reason}".`
      );
      return;
    }
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const generateWhatsAppUrl = (student: Student, status: string) => {
    const rawPhone = student.parentPhone || student.phone || '';
    if (!rawPhone) return null;
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const className = selectedClass?.name || 'Class';
    const text = `Sirajul Huda College Alert: Your ward ${student.name} (Reg No: ${student.registerNumber}, Class ${className}) was marked ${status} for daily college attendance on ${selectedDate}.`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) return;

    if (declaredLeave?.isLeave) {
      alert(
        `Daily attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedClass?.name} because of: "${declaredLeave.reason}".`
      );
      return;
    }

    setSaving(true);
    setSuccessMessage('');

    try {
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendanceState[s.id] || 'PRESENT',
      }));

      await api.post('/attendance/daily', {
        classId: selectedClassId,
        date: selectedDate,
        records,
      });

      setSuccessMessage(`Daily attendance logged & synced for ${students.length} students!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save daily attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar
        title="Daily College Attendance"
        subtitle="Track daily student presence independently from subject periods"
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* DECLARED CLASS LEAVE / HOLIDAY ALERT BANNER */}
        {declaredLeave?.isLeave && (
          <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Class Leave Declared
                  </span>
                  <span className="text-xs font-bold text-amber-800">
                    Daily Attendance Closed for this Date
                  </span>
                </div>
                <h3 className="text-base font-black text-amber-950 mt-1">
                  This day ({selectedDate}) is declared as LEAVE for Class {selectedClass?.name} because of: "{declaredLeave.reason}".
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Marking of daily attendance is disabled on declared leave / exam / study days.
                </p>
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-200/80 border border-amber-300 text-amber-950 font-black text-xs flex items-center gap-2 shrink-0">
              <Lock className="w-4 h-4 text-amber-800" />
              <span>Marking Disabled</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
              />
              <span className="text-[11px] font-semibold text-teal-700 mt-1 block">
                🌙 Hijri: {getHijriDateString(selectedDate)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none min-w-40 font-bold"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              disabled={Boolean(declaredLeave?.isLeave)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('LEAVE')}
              disabled={Boolean(declaredLeave?.isLeave)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Give leave to entire class today"
            >
              All Leave
            </button>

            {declaredLeave?.isLeave ? (
              <div className="px-5 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center gap-2 cursor-not-allowed shadow-xs">
                <Lock className="w-4 h-4 text-amber-800" />
                <span>Attendance Closed (Leave: {declaredLeave.reason})</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Daily Attendance'}</span>
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-auto w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 w-20">Roll No</th>
                  <th className="px-5 py-3.5 w-28">Reg Number</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-5 py-3.5 text-center w-52">Daily Status</th>
                  <th className="px-5 py-3.5 text-center w-40">WhatsApp Parent Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Loading students...
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((st) => {
                    const status = attendanceState[st.id] || 'PRESENT';
                    const waUrl = generateWhatsAppUrl(st, status);

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          status !== 'PRESENT' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">#{st.rollNumber}</td>
                        <td className="px-6 py-4 font-bold text-brand-700">{st.registerNumber}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                          {st.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              disabled={Boolean(declaredLeave?.isLeave)}
                              onClick={() => handleToggle(st.id, 'PRESENT')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${declaredLeave?.isLeave ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Present</span>
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(declaredLeave?.isLeave)}
                              onClick={() => handleToggle(st.id, 'ABSENT')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${declaredLeave?.isLeave ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Absent</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {status !== 'PRESENT' ? (
                            waUrl ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow-sm transition-all"
                                title="Send WhatsApp alert to parent"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Parent</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Phone</span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No active students found in this class
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
