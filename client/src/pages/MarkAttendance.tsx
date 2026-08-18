import React, { useEffect, useState } from 'react';
import { CheckSquare, Save, Search, Sparkles, CheckCircle2, XCircle, Clock, BookOpen, MessageSquare, Phone, Link2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { ClassSubject, Student, AttendanceSession } from '../types';
import { Navbar } from '../components/Navbar';
import { useAcademic } from '../context/AcademicContext';
import { getHijriDateString } from '../utils/hijri';

export const MarkAttendance: React.FC = () => {
  const { selectedDate, setSelectedDate } = useAcademic();
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedClassSubjectId, setSelectedClassSubjectId] = useState<string>('');
  const [period, setPeriod] = useState<number>(1);

  // Usthad Syllabus log fields
  const [topicTaught, setTopicTaught] = useState<string>('');
  const [kitabPage, setKitabPage] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [whatsappAlerts, setWhatsappAlerts] = useState<any[]>([]);

  const fetchClassSubjects = () => {
    api.get('/class-subjects').then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setClassSubjects(list);
      if (list.length > 0) {
        setSelectedClassSubjectId(list[0].id);
      }
    });
  };

  useEffect(() => {
    fetchClassSubjects();
  }, []);

  const selectedCS = classSubjects.find((cs) => cs.id === selectedClassSubjectId);

  useEffect(() => {
    if (!selectedCS) return;
    setLoading(true);
    setSuccessMsg('');
    setWhatsappAlerts([]);

    Promise.all([
      api.get('/students', { params: { classId: selectedCS.classId } }),
      api.get('/attendance/sessions', {
        params: {
          classId: selectedCS.classId,
          subjectId: selectedCS.subjectId,
          date: selectedDate,
        },
      }),
    ])
      .then(([studRes, sessRes]) => {
        const studentList: Student[] = Array.isArray(studRes.data) ? studRes.data : studRes.data?.students || [];
        setStudents(studentList);

        const existingSessions: AttendanceSession[] = Array.isArray(sessRes.data) ? sessRes.data : [];
        const matchingSession = existingSessions.find((s) => s.period === Number(period));

        const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};

        if (matchingSession && matchingSession.records) {
          setTopicTaught(matchingSession.topicTaught || '');
          setKitabPage(matchingSession.kitabPage || '');
          matchingSession.records.forEach((r: any) => {
            initialMap[r.studentId] = r.status as any;
          });
        } else {
          setTopicTaught('');
          setKitabPage('');
          studentList.forEach((st) => {
            initialMap[st.id] = 'PRESENT'; // Default All Present
          });
        }

        setAttendance(initialMap);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassSubjectId, selectedDate, period]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
    students.forEach((st) => {
      updated[st.id] = status;
    });
    setAttendance(updated);
  };

  const generateWhatsAppUrl = (student: Student, status: string) => {
    const rawPhone = student.parentPhone || student.phone || '';
    if (!rawPhone) return null;
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const subjectName = selectedCS?.subject.name || 'Subject';
    const text = `Sirajul Huda College Alert: Your ward ${student.name} (Reg No: ${student.registerNumber}) was marked ${status} for period ${period} (${subjectName}) on ${selectedDate}.`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleSave = async () => {
    if (!selectedClassSubjectId || !selectedDate) return;
    setSaving(true);
    setSuccessMsg('');
    setWhatsappAlerts([]);

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await api.post('/attendance/session', {
        classSubjectId: selectedClassSubjectId,
        date: selectedDate,
        period,
        topicTaught,
        kitabPage,
        records,
      });

      setSuccessMsg('Attendance session & Usthad syllabus log saved successfully!');
      if (res.data.whatsappAlerts) {
        setWhatsappAlerts(res.data.whatsappAlerts);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save attendance session');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'ABSENT').length;
  const leaveCount = Object.values(attendance).filter((s) => s === 'LEAVE').length;

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Mark Period Attendance" subtitle="Select Class, Subject, Period, and log syllabus progress" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Warning if 0 Class-Subject Assignments exist */}
        {classSubjects.length === 0 && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">No Class Subject Assignments Configured</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Before marking period attendance, subjects and Usthads must be assigned to classes.
                </p>
              </div>
            </div>
            <Link
              to="/class-assignments"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 shrink-0"
            >
              <Link2 className="w-4 h-4" />
              <span>Assign Subjects to Classes</span>
            </Link>
          </div>
        )}

        {/* Header Controls */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Class — Subject — Usthad
              </label>
              <select
                value={selectedClassSubjectId}
                onChange={(e) => setSelectedClassSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:outline-none font-bold"
              >
                {classSubjects.length === 0 ? (
                  <option value="">No Class-Subject Assignments Found</option>
                ) : (
                  classSubjects.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      Class {cs.class.name} — {cs.subject.name} ({cs.teacher.name})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Session Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:outline-none font-bold"
              />
              <span className="text-[11px] font-semibold text-teal-700 mt-1 block">
                🌙 Hijri: {getHijriDateString(selectedDate)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Period Number
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:outline-none font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Usthad Syllabus / Kitab Progress Inputs */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                <span>Kitab Lesson / Topic Taught Today</span>
              </label>
              <input
                type="text"
                placeholder="e.g. كتاب الصلاة - باب شروط الصلاة"
                value={topicTaught}
                onChange={(e) => setTopicTaught(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                Kitab Page / Chapter Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Page 45 - 48"
                value={kitabPage}
                onChange={(e) => setKitabPage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* Summary Counter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs font-bold">
            <span className="text-slate-700">
              Total Students: <strong className="text-slate-900">{students.length}</strong>
            </span>
            <span className="text-emerald-700">
              Present: <strong className="text-emerald-800">{presentCount}</strong>
            </span>
            <span className="text-rose-600">
              Absent: <strong className="text-rose-700">{absentCount}</strong>
            </span>
            <span className="text-amber-600">
              Leave: <strong className="text-amber-700">{leaveCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 border border-emerald-200"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 border border-rose-200"
            >
              Mark All Absent
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedClassSubjectId}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Session Attendance'}</span>
            </button>
          </div>
        </div>

        {/* Student Attendance Marking Roster */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Register No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Parent Contact</th>
                  <th className="px-6 py-3.5 text-center">Attendance Status</th>
                  <th className="px-6 py-3.5 text-center">WhatsApp Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading roster for selected class session...
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((st) => {
                    const stStatus = attendance[st.id] || 'PRESENT';
                    const waUrl = generateWhatsAppUrl(st, stStatus);

                    return (
                      <tr key={st.id} className={`hover:bg-slate-50/80 transition-colors ${stStatus !== 'PRESENT' ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-6 py-4 font-bold text-slate-900">#{st.rollNumber}</td>
                        <td className="px-6 py-4 font-bold text-brand-700">{st.registerNumber}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{st.name}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {st.parentPhone || st.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(st.id, 'LEAVE')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'LEAVE'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {stStatus !== 'PRESENT' ? (
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
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      {classSubjects.length === 0
                        ? 'Please assign subjects to classes on Class Assignments page'
                        : 'No active students found in this class'}
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
