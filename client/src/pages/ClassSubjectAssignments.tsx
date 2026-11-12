import { useEffect, useState } from 'react';
import {
  Plus, Link2, Trash2, Calendar, Settings2, CheckSquare, Square,
  Copy, Check, Search, Sparkles, Filter, AlertCircle, ArrowRight, UserCheck, CheckCircle2
} from 'lucide-react';
import api from '../utils/api';
import { Class, Subject, Teacher, ClassSubject, AcademicMonth } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const ClassSubjectAssignments = () => {
  const [assignments, setAssignments] = useState<ClassSubject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string>('');

  // Batch Selection State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [batchTeacherId, setBatchTeacherId] = useState<string>('');
  const [batchSaving, setBatchSaving] = useState(false);

  // Copy From Class Modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState<string>('');
  const [copySaving, setCopySaving] = useState(false);

  // Available Classes Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configAssignment, setConfigAssignment] = useState<ClassSubject | null>(null);
  const [availableClassesInput, setAvailableClassesInput] = useState<number>(23);

  const fetchData = async () => {
    try {
      const [assignRes, clsRes, subRes, tchRes, monthRes] = await Promise.all([
        api.get('/class-subjects'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers'),
        api.get('/academic-months'),
      ]);
      setAssignments(assignRes.data);
      const clsList = clsRes.data || [];
      setClasses(clsList);
      setSubjects(subRes.data || []);
      setTeachers(tchRes.data || []);
      setAcademicMonths(monthRes.data || []);

      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }
      if (monthRes.data.length > 0 && !selectedMonthId) {
        setSelectedMonthId(monthRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Map of subjectId -> assigned ClassSubject for current class
  const classAssignmentMap: Record<string, ClassSubject> = {};
  assignments
    .filter((a) => a.classId === selectedClassId)
    .forEach((a) => {
      classAssignmentMap[a.subjectId] = a;
    });

  // Handle direct inline assignment dropdown change
  const handleInlineAssign = async (subjectId: string, teacherId: string) => {
    if (!selectedClassId) return;

    if (!teacherId) {
      // Unassign if empty
      const existing = classAssignmentMap[subjectId];
      if (existing) {
        try {
          await api.delete(`/class-subjects/${existing.id}`);
          setAssignments((prev) => prev.filter((a) => a.id !== existing.id));
          showNotification('Subject unassigned successfully');
        } catch (err: any) {
          alert(err.response?.data?.error || 'Failed to unassign subject');
        }
      }
      return;
    }

    setSavingId(subjectId);
    try {
      const res = await api.post('/class-subjects', {
        classId: selectedClassId,
        subjectId,
        teacherId,
      });

      // Update local state
      setAssignments((prev) => {
        const filtered = prev.filter((a) => !(a.classId === selectedClassId && a.subjectId === subjectId));
        return [...filtered, res.data];
      });

      const teacherObj = teachers.find((t) => t.id === teacherId);
      const subjectObj = subjects.find((s) => s.id === subjectId);
      showNotification(`Assigned ${subjectObj?.name || 'Subject'} to ${teacherObj?.name || 'Usthad'}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign subject');
    } finally {
      setSavingId(null);
    }
  };

  // Batch Assignment Handler
  const handleBatchAssign = async () => {
    if (!selectedClassId || selectedSubjectIds.length === 0 || !batchTeacherId) {
      alert('Please select subjects and an Usthad to assign');
      return;
    }

    setBatchSaving(true);
    try {
      await api.post('/class-subjects/batch', {
        classId: selectedClassId,
        subjectIds: selectedSubjectIds,
        teacherId: batchTeacherId,
      });

      await fetchData();
      setSelectedSubjectIds([]);
      setBatchTeacherId('');
      showNotification(`Successfully assigned ${selectedSubjectIds.length} subjects!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to batch assign subjects');
    } finally {
      setBatchSaving(false);
    }
  };

  // Toggle selection for batch
  const handleToggleSubjectSelect = (subId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjectIds.length === filteredSubjects.length) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(filteredSubjects.map((s) => s.id));
    }
  };

  // Copy From Class Handler
  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copySourceClassId || !selectedClassId) return;

    setCopySaving(true);
    try {
      const res = await api.post('/class-subjects/copy', {
        fromClassId: copySourceClassId,
        toClassId: selectedClassId,
      });
      await fetchData();
      setIsCopyModalOpen(false);
      showNotification(res.data.message || 'Subjects copied successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to copy subjects');
    } finally {
      setCopySaving(false);
    }
  };

  const handleOpenConfigModal = (asg: ClassSubject) => {
    setConfigAssignment(asg);
    setAvailableClassesInput(23);
    setIsConfigModalOpen(true);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configAssignment || !selectedMonthId) return;

    try {
      await api.post('/subject-configs', {
        classSubjectId: configAssignment.id,
        monthId: selectedMonthId,
        availableClasses: availableClassesInput,
      });
      showNotification('Available classes configured successfully!');
      setIsConfigModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update available classes');
    }
  };

  // Filter subjects by search
  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.arabicName && s.arabicName.toLowerCase().includes(q)) ||
      s.code.toLowerCase().includes(q)
    );
  });

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const totalAssignedInClass = Object.keys(classAssignmentMap).length;

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar
        title="Class-Subject & Usthad Mapping"
        subtitle="Quickly assign subjects to Usthads per class with 1-click matrix or batch assign"
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 1. CLASS SELECTION TABS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black text-brand-700 uppercase tracking-wider">
                Step 1: Choose Class to Assign
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Class: {selectedClass ? selectedClass.name : 'Select a Class'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCopySourceClassId(classes.find((c) => c.id !== selectedClassId)?.id || '');
                  setIsCopyModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200"
                title="Copy all subject assignments from another class"
              >
                <Copy className="w-3.5 h-3.5 text-brand-600" />
                <span>Copy From Another Class</span>
              </button>
            </div>
          </div>

          {/* Class Pill Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const countForClass = assignments.filter((a) => a.classId === cls.id).length;

              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedSubjectIds([]);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>Class {cls.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {countForClass} Subjects
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. BATCH ASSIGN FLOATING / ACTION TOOLBAR */}
        {selectedSubjectIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-950 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                {selectedSubjectIds.length}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                  Batch Assign {selectedSubjectIds.length} Selected Subjects
                </h4>
                <p className="text-[11px] text-indigo-700">
                  Assign all checked subjects to one Usthad in 1 click for Class {selectedClass?.name}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={batchTeacherId}
                onChange={(e) => setBatchTeacherId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Usthad to Assign --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBatchAssign}
                disabled={batchSaving || !batchTeacherId}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{batchSaving ? 'Assigning...' : 'Apply to Selected'}</span>
              </button>

              <button
                onClick={() => setSelectedSubjectIds([])}
                className="px-3 py-2 rounded-xl bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* 3. SEARCH & STATS BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject by English or Arabic name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500">
              Assigned in Class {selectedClass?.name}:{' '}
              <strong className="text-emerald-700">
                {totalAssignedInClass} / {subjects.length} Subjects
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Target Month:{' '}
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="bg-transparent text-brand-700 font-bold focus:outline-none cursor-pointer"
              >
                {academicMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.monthName} ({m.workingDays}d)
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>

        {/* 4. FAST INLINE ASSIGNMENT ROSTER */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="Select all subjects for batch assign"
                    >
                      {selectedSubjectIds.length > 0 && selectedSubjectIds.length === filteredSubjects.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Subject & Code</th>
                  <th className="px-5 py-3.5">Arabic Title</th>
                  <th className="px-5 py-3.5">Assigned Usthad (Select Directly)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Loading subjects and assignments...
                    </td>
                  </tr>
                ) : filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub) => {
                    const existingAssignment = classAssignmentMap[sub.id];
                    const isAssigned = Boolean(existingAssignment);
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    const isSaving = savingId === sub.id;

                    return (
                      <tr
                        key={sub.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : isAssigned ? 'bg-white' : 'bg-amber-50/20'
                        }`}
                      >
                        {/* Checkbox for batch */}
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSubjectSelect(sub.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                        </td>

                        {/* Subject Name & Code */}
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{sub.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">{sub.code}</span>
                          </div>
                        </td>

                        {/* Arabic Title */}
                        <td className="px-5 py-3.5">
                          <span className="font-arabic font-bold text-teal-800 text-sm">
                            {sub.arabicName || '—'}
                          </span>
                        </td>

                        {/* INLINE TEACHER SELECTOR DROPDOWN */}
                        <td className="px-5 py-3.5">
                          <div className="relative max-w-xs">
                            <select
                              value={existingAssignment?.teacherId || ''}
                              onChange={(e) => handleInlineAssign(sub.id, e.target.value)}
                              disabled={isSaving}
                              className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                isAssigned
                                  ? 'border-emerald-300 bg-emerald-50/50 text-slate-900 hover:border-emerald-500'
                                  : 'border-slate-200 bg-slate-50/80 text-slate-500 hover:border-brand-500'
                              } focus:outline-none focus:ring-2 focus:ring-brand-500`}
                            >
                              <option value="">-- Click to Assign Usthad --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {isSaving && (
                              <span className="text-[10px] text-brand-600 font-bold ml-2 animate-pulse">
                                Saving...
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5 text-center">
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{existingAssignment.teacher?.name}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAssigned && (
                              <>
                                <button
                                  onClick={() => handleOpenConfigModal(existingAssignment)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                                  title="Configure available classes in month"
                                >
                                  <Settings2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleInlineAssign(sub.id, '')}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Unassign this Usthad"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No subjects found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 5. COPY ASSIGNMENTS FROM CLASS MODAL */}
      <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title="Copy Subject Assignments From Another Class">
        <form onSubmit={handleCopySubmit} className="space-y-4">
          <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Instant Class Cloning</p>
              <p className="text-[11px] text-brand-700 mt-0.5">
                Copy all subjects and assigned Usthads from a completed class into <strong>Class {selectedClass?.name}</strong> in 1 click!
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Source Class to Copy From
            </label>
            <select
              required
              value={copySourceClassId}
              onChange={(e) => setCopySourceClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:outline-none"
            >
              <option value="">-- Choose Source Class --</option>
              {classes
                .filter((c) => c.id !== selectedClassId)
                .map((c) => {
                  const count = assignments.filter((a) => a.classId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      Class {c.name} ({count} subjects assigned)
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={copySaving || !copySourceClassId}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>{copySaving ? 'Copying...' : 'Copy All Assignments'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. AVAILABLE CLASSES CONFIG MODAL */}
      {configAssignment && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={`Set Monthly Classes for ${configAssignment.subject?.name}`}
        >
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-800 border border-brand-200">
              Setting available classes for <strong>Class {configAssignment.class?.name}</strong> &mdash;{' '}
              <strong>{configAssignment.subject?.name}</strong>.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Available Classes Count in Month
              </label>
              <input
                type="number"
                min="0"
                required
                value={availableClassesInput}
                onChange={(e) => setAvailableClassesInput(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:outline-none font-bold"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
