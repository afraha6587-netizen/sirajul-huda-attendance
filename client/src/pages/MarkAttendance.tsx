import React, { useEffect, useState } from 'react';
import {
  CheckSquare, Save, Search, Sparkles, CheckCircle2, XCircle, Clock,
  BookOpen, MessageSquare, Phone, Link2, AlertCircle, Edit3, Lock, Unlock, RotateCcw
} from 'lucide-react';
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

  // Single attendance per subject per day lock & edit states
  const [isAlreadyMarked, setIsAlreadyMarked] = useState<boolean>(false);
  const [existingSession, setExistingSession] = useState<AttendanceSession | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  // Declared Class Leave / Holiday state
  const [declaredLeave, setDeclaredLeave] = useState<{ isLeave: boolean; reason?: string; message?: string } | null>(null);

  // Backup copies to revert if editing is cancelled
  const [originalAttendance, setOriginalAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});
  const [originalTopicTaught, setOriginalTopicTaught] = useState<string>('');
  const [originalKitabPage, setOriginalKitabPage] = useState<string>('');
  const [originalPeriod, setOriginalPeriod] = useState<number>(1);

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
    if (!selectedCS || !selectedClassSubjectId) return;
    setLoading(true);
    setSuccessMsg('');
    setWhatsappAlerts([]);

    Promise.all([
      api.get('/students', { params: { classId: selectedCS.classId } }),
      api.get('/attendance/sessions', {
        params: {
          classSubjectId: selectedClassSubjectId,
          date: selectedDate,
        },
      }),
      api.get('/attendance/check-leave', {
        params: {
          classId: selectedCS.classId,
          date: selectedDate,
        },
      }),
    ])
      .then(([studRes, sessRes, leaveRes]) => {
        const studentList: Student[] = Array.isArray(studRes.data) ? studRes.data : studRes.data?.students || [];
        setStudents(studentList);

        // Check if class leave / holiday is declared for this date
        if (leaveRes.data?.isLeave) {
          setDeclaredLeave(leaveRes.data);
        } else {
          setDeclaredLeave(null);
        }

        const existingSessions: AttendanceSession[] = Array.isArray(sessRes.data) ? sessRes.data : [];
        const sessionFound = existingSessions.length > 0 ? existingSessions[0] : null;

        const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};

        if (sessionFound && sessionFound.records) {
          // Attendance already recorded for this subject on this date!
          setExistingSession(sessionFound);
          setIsAlreadyMarked(true);
          setIsEditing(false); // Locked view mode until user clicks "Edit Attendance"

          const recordedPeriod = sessionFound.period || 1;
          const recordedTopic = sessionFound.topicTaught || '';
          const recordedKitab = sessionFound.kitabPage || '';

          setPeriod(recordedPeriod);
          setTopicTaught(recordedTopic);
          setKitabPage(recordedKitab);

          setOriginalPeriod(recordedPeriod);
          setOriginalTopicTaught(recordedTopic);
          setOriginalKitabPage(recordedKitab);

          sessionFound.records.forEach((r: any) => {
            initialMap[r.studentId] = r.status as any;
          });
          // Ensure all active students in class have an entry
          studentList.forEach((st) => {
            if (!initialMap[st.id]) initialMap[st.id] = 'PRESENT';
          });
        } else {
          // Not marked yet for this subject on this date
          setExistingSession(null);
          setIsAlreadyMarked(false);
          setIsEditing(true);

          setTopicTaught('');
          setKitabPage('');
          setOriginalTopicTaught('');
          setOriginalKitabPage('');

          studentList.forEach((st) => {
            initialMap[st.id] = 'PRESENT'; // Default All Present
          });
        }

        setAttendance(initialMap);
        setOriginalAttendance(initialMap);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassSubjectId, selectedDate]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    if (declaredLeave?.isLeave) {
      alert(`Attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedCS?.class.name} because of: "${declaredLeave.reason}".`);
      return;
    }
    if (isAlreadyMarked && !isEditing) {
      if (window.confirm('Attendance is already marked for this subject today. Would you like to enter Edit Mode to modify records?')) {
        setIsEditing(true);
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
      }
      return;
    }
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    if (declaredLeave?.isLeave) {
      alert(`Attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedCS?.class.name} because of: "${declaredLeave.reason}".`);
      return;
    }
    if (isAlreadyMarked && !isEditing) {
      if (window.confirm('Attendance is already marked for this subject today. Would you like to enter Edit Mode to modify records?')) {
        setIsEditing(true);
      } else {
        return;
      }
    }
    const updated: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
    students.forEach((st) => {
      updated[st.id] = status;
    });
    setAttendance(updated);
  };

  const handleCancelEdit = () => {
    setAttendance({ ...originalAttendance });
    setTopicTaught(originalTopicTaught);
    setKitabPage(originalKitabPage);
    setPeriod(originalPeriod);
    setIsEditing(false);
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

    if (declaredLeave?.isLeave) {
      alert(`Attendance cannot be marked: This day (${selectedDate}) is declared as leave for Class ${selectedCS?.class.name} because of: "${declaredLeave.reason}".`);
      return;
    }

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
        isEdit: isAlreadyMarked,
        sessionId: existingSession?.id,
      });

      if (isAlreadyMarked) {
        setSuccessMsg('Pre-added attendance record & syllabus log updated successfully! (No duplicate session created)');
      } else {
        setSuccessMsg('Attendance session & Usthad syllabus log saved successfully!');
      }

      setIsAlreadyMarked(true);
      setIsEditing(false);
      setOriginalAttendance({ ...attendance });
      setOriginalTopicTaught(topicTaught);
      setOriginalKitabPage(kitabPage);
      setOriginalPeriod(period);

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
                    Attendance Closed for this Date
                  </span>
                </div>
                <h3 className="text-base font-black text-amber-950 mt-1">
                  This day ({selectedDate}) is declared as LEAVE for Class {selectedCS?.class.name} because of: "{declaredLeave.reason}".
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Marking of attendance is not available on declared leave / exam / study days. This day will not penalize students' attendance percentage.
                </p>
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-200/80 border border-amber-300 text-amber-950 font-black text-xs flex items-center gap-2 shrink-0">
              <Lock className="w-4 h-4 text-amber-800" />
              <span>Marking Disabled</span>
            </div>
          </div>
        )}

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

        {/* ALREADY MARKED ALERT BANNER (Locked View) */}
        {isAlreadyMarked && !isEditing && (
          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 text-amber-800">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    Already Marked
                  </span>
                  <h4 className="text-sm font-bold">
                    Attendance Already Marked for {selectedCS?.subject.name} Today
                  </h4>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Recorded for <strong>Period {period}</strong> on <strong>{selectedDate}</strong> by {selectedCS?.teacher.name}. A second attendance cannot be created on the same day. Click <strong>Edit Attendance</strong> below if you need to update this record.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2 shrink-0 transition-all hover:scale-[1.02]"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Attendance</span>
            </button>
          </div>
        )}

        {/* EDITING PRE-ADDED RECORD BANNER (Edit Mode) */}
        {isAlreadyMarked && isEditing && (
          <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-300 text-blue-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-200/80 flex items-center justify-center shrink-0 text-blue-800">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                    Edit Mode Active
                  </span>
                  <h4 className="text-sm font-bold">
                    Editing Pre-Added Attendance Record
                  </h4>
                </div>
                <p className="text-xs text-blue-800 mt-1">
                  You are editing the existing attendance record for {selectedCS?.subject.name} (Period {period}). Saving will update the pre-added data in-place — no duplicate attendance will be marked.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Period Number</span>
                {isAlreadyMarked && !isEditing && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                disabled={isAlreadyMarked && !isEditing}
                className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-brand-600 focus:outline-none font-bold ${
                  isAlreadyMarked && !isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50'
                }`}
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
                {isAlreadyMarked && !isEditing && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 ml-auto">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. كتاب الصلاة - باب شروط الصلاة"
                value={topicTaught}
                onChange={(e) => setTopicTaught(e.target.value)}
                disabled={isAlreadyMarked && !isEditing}
                className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none ${
                  isAlreadyMarked && !isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Kitab Page / Chapter Reference</span>
                {isAlreadyMarked && !isEditing && (
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Page 45 - 48"
                value={kitabPage}
                onChange={(e) => setKitabPage(e.target.value)}
                disabled={isAlreadyMarked && !isEditing}
                className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none ${
                  isAlreadyMarked && !isEditing ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50'
                }`}
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
              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark All Absent
            </button>
            <button
              onClick={() => handleMarkAll('LEAVE')}
              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 border border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Give leave to all students in this session"
            >
              Mark All Leave
            </button>

            {/* ACTION BUTTON: Dynamically switches between Declared Leave, Edit, Update, and Save */}
            {declaredLeave?.isLeave ? (
              <div className="px-5 py-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center gap-2 cursor-not-allowed shadow-xs">
                <Lock className="w-4 h-4 text-amber-800" />
                <span>Attendance Closed (Leave: {declaredLeave.reason})</span>
              </div>
            ) : isAlreadyMarked && !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Attendance</span>
              </button>
            ) : isAlreadyMarked && isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedClassSubjectId}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Updating...' : 'Update Attendance'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedClassSubjectId}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Session Attendance'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Attendance Marking Roster */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-auto w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
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
                              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
                              onClick={() => handleStatusChange(st.id, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${declaredLeave?.isLeave ? 'opacity-40 cursor-not-allowed' : isAlreadyMarked && !isEditing ? 'opacity-90 cursor-pointer' : ''}`}
                              title={declaredLeave?.isLeave ? `Attendance closed: ${declaredLeave.reason}` : isAlreadyMarked && !isEditing ? 'Attendance is locked. Click to enter edit mode' : ''}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
                              onClick={() => handleStatusChange(st.id, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${declaredLeave?.isLeave ? 'opacity-40 cursor-not-allowed' : isAlreadyMarked && !isEditing ? 'opacity-90 cursor-pointer' : ''}`}
                              title={declaredLeave?.isLeave ? `Attendance closed: ${declaredLeave.reason}` : isAlreadyMarked && !isEditing ? 'Attendance is locked. Click to enter edit mode' : ''}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(declaredLeave?.isLeave) || (isAlreadyMarked && !isEditing)}
                              onClick={() => handleStatusChange(st.id, 'LEAVE')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                stStatus === 'LEAVE'
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/50'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${declaredLeave?.isLeave ? 'opacity-40 cursor-not-allowed' : isAlreadyMarked && !isEditing ? 'opacity-90 cursor-pointer' : ''}`}
                              title={declaredLeave?.isLeave ? `Attendance closed: ${declaredLeave.reason}` : isAlreadyMarked && !isEditing ? 'Attendance is locked. Click to enter edit mode' : ''}
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
