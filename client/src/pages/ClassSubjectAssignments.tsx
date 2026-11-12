import React, { useEffect, useState } from 'react';
import {
  Plus, Trash2, Settings2, CheckSquare, Square,
  Copy, Check, Search, Sparkles, CheckCircle2, BookOpen, AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Class, Subject, Teacher, ClassSubject, AcademicMonth } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const ClassSubjectAssignments: React.FC = () => {
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

  // Batch Selection State (stores ClassSubject IDs for current class)
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [batchTeacherId, setBatchTeacherId] = useState<string>('');
  const [batchSaving, setBatchSaving] = useState(false);

  // Add Subject to Class Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'existing' | 'new'>('new');
  const [existingSubjectId, setExistingSubjectId] = useState('');
  const [existingTeacherId, setExistingTeacherId] = useState('');
  const [newSubjectData, setNewSubjectData] = useState({
    name: '',
    arabicName: '',
    code: '',
    teacherId: '',
  });
  const [addSaving, setAddSaving] = useState(false);

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
      setAssignments(assignRes.data || []);
      const clsList = clsRes.data || [];
      setClasses(clsList);
      setSubjects(subRes.data || []);
      setTeachers(tchRes.data || []);
      setAcademicMonths(monthRes.data || []);

      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }
      if (monthRes.data?.length > 0 && !selectedMonthId) {
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

  // Subjects assigned STRICTLY to the selected class
  const classAssignments = assignments.filter((a) => a.classId === selectedClassId);

  // Filtered by search query
  const filteredAssignments = classAssignments.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const sub = a.subject;
    if (!sub) return false;
    return (
      sub.name.toLowerCase().includes(q) ||
      (sub.arabicName && sub.arabicName.toLowerCase().includes(q)) ||
      sub.code.toLowerCase().includes(q) ||
      (a.teacher && a.teacher.name.toLowerCase().includes(q))
    );
  });

  // Subjects available in catalog that are not yet assigned to the current class
  const availableCatalogSubjects = subjects.filter(
    (s) => !classAssignments.some((a) => a.subjectId === s.id)
  );

  // Inline Teacher change for a class subject
  const handleInlineTeacherChange = async (assignmentId: string, teacherId: string) => {
    if (!teacherId) return;
    setSavingId(assignmentId);
    try {
      const res = await api.put(`/class-subjects/${assignmentId}`, { teacherId });
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, ...res.data } : a))
      );
      showNotification('Usthad updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update assigned Usthad');
    } finally {
      setSavingId(null);
    }
  };

  // Remove a subject from the current class
  const handleRemoveSubjectFromClass = async (asg: ClassSubject) => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (
      !window.confirm(
        `Are you sure you want to remove "${asg.subject?.name}" from Class ${selectedClass?.name}?\n\n(This will only remove it from this class. It will NOT affect other classes).`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/class-subjects/${asg.id}`);
      setAssignments((prev) => prev.filter((a) => a.id !== asg.id));
      setSelectedAssignmentIds((prev) => prev.filter((id) => id !== asg.id));
      showNotification(`Subject removed from Class ${selectedClass?.name}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove subject from class');
    }
  };

  // Batch Selection Handlers
  const handleToggleSelect = (asgId: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(asgId) ? prev.filter((id) => id !== asgId) : [...prev, asgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssignmentIds.length === filteredAssignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(filteredAssignments.map((a) => a.id));
    }
  };

  const handleBatchAssign = async () => {
    if (!selectedClassId || selectedAssignmentIds.length === 0 || !batchTeacherId) {
      alert('Please select subjects and a teacher to assign.');
      return;
    }

    setBatchSaving(true);
    try {
      const subjectIds = classAssignments
        .filter((a) => selectedAssignmentIds.includes(a.id))
        .map((a) => a.subjectId);

      await api.post('/class-subjects/batch', {
        classId: selectedClassId,
        subjectIds,
        teacherId: batchTeacherId,
      });

      await fetchData();
      setSelectedAssignmentIds([]);
      setBatchTeacherId('');
      showNotification(`Assigned Usthad to ${subjectIds.length} subjects!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to batch assign teacher');
    } finally {
      setBatchSaving(false);
    }
  };

  // Open Add Subject Modal
  const handleOpenAddModal = () => {
    setAddMode(availableCatalogSubjects.length > 0 ? 'existing' : 'new');
    setExistingSubjectId(availableCatalogSubjects[0]?.id || '');
    setExistingTeacherId(teachers[0]?.id || '');
    setNewSubjectData({
      name: '',
      arabicName: '',
      code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      teacherId: teachers[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Subject (Existing or New)
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setAddSaving(true);
    try {
      if (addMode === 'existing') {
        if (!existingSubjectId || !existingTeacherId) {
          alert('Please select both a subject and an Usthad');
          setAddSaving(false);
          return;
        }

        await api.post('/class-subjects', {
          classId: selectedClassId,
          subjectId: existingSubjectId,
          teacherId: existingTeacherId,
        });
        showNotification('Subject assigned to this class successfully!');
      } else {
        if (!newSubjectData.name || !newSubjectData.code || !newSubjectData.teacherId) {
          alert('Please fill in subject name, code, and select an Usthad');
          setAddSaving(false);
          return;
        }

        await api.post('/subjects', {
          name: newSubjectData.name,
          arabicName: newSubjectData.arabicName || newSubjectData.name,
          code: newSubjectData.code,
          classId: selectedClassId,
          teacherId: newSubjectData.teacherId,
        });
        showNotification(`Created and added "${newSubjectData.name}" to this class!`);
      }

      await fetchData();
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add subject to class');
    } finally {
      setAddSaving(false);
    }
  };

  // Copy From Another Class Submit
  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copySourceClassId || !selectedClassId) return;

    setCopySaving(true);
    try {
      const res = await api.post('/class-subjects/copy', {
        sourceClassId: copySourceClassId,
        targetClassId: selectedClassId,
      });

      await fetchData();
      setIsCopyModalOpen(false);
      showNotification(res.data?.message || 'Subjects copied successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to copy subjects');
    } finally {
      setCopySaving(false);
    }
  };

  // Available Classes Config Handlers
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

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar
        title="Class-Specific Subject & Usthad Mapping"
        subtitle="Each class has its own subjects. Assign and manage subjects specifically per class without spilling over."
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 1. CLASS SELECTION TABS & TOP ACTIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black text-brand-700 uppercase tracking-wider">
                Active Class View
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <span>Class {selectedClass ? selectedClass.name : 'Select a Class'}</span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {classAssignments.length} Subjects Assigned
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-brand-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Subject to Class {selectedClass?.name}</span>
              </button>

              <button
                onClick={() => {
                  setCopySourceClassId(classes.find((c) => c.id !== selectedClassId)?.id || '');
                  setIsCopyModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200"
                title="Copy all subject assignments from another class"
              >
                <Copy className="w-4 h-4 text-brand-600" />
                <span>Copy From Another Class</span>
              </button>
            </div>
          </div>

          {/* Class Pill Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const countForClass = assignments.filter((a) => a.classId === cls.id).length;

              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setSelectedAssignmentIds([]);
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
                    {countForClass} {countForClass === 1 ? 'Subject' : 'Subjects'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. BATCH ASSIGN ACTION TOOLBAR */}
        {selectedAssignmentIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-950 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                {selectedAssignmentIds.length}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                  Batch Assign {selectedAssignmentIds.length} Selected Subjects
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
                onClick={() => setSelectedAssignmentIds([])}
                className="px-3 py-2 rounded-xl bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* 3. SEARCH & MONTH SELECTOR BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search subjects in Class ${selectedClass?.name || ''}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500">
              Class {selectedClass?.name} Subjects:{' '}
              <strong className="text-emerald-700">
                {classAssignments.length} Assigned
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

        {/* 4. CLASS SUBJECTS TABLE (ONLY SHOWS SUBJECTS FOR THIS CLASS) */}
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
                      {selectedAssignmentIds.length > 0 &&
                      selectedAssignmentIds.length === filteredAssignments.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Subject & Code</th>
                  <th className="px-5 py-3.5">Arabic Title</th>
                  <th className="px-5 py-3.5">Assigned Usthad (Change Directly)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Loading subjects for Class {selectedClass?.name}...
                    </td>
                  </tr>
                ) : filteredAssignments.length > 0 ? (
                  filteredAssignments.map((asg) => {
                    const sub = asg.subject;
                    const isSelected = selectedAssignmentIds.includes(asg.id);
                    const isSaving = savingId === asg.id;

                    return (
                      <tr
                        key={asg.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Checkbox for batch */}
                        <td className="px-4 py-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(asg.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                        </td>

                        {/* Subject Name & Code */}
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">
                              {sub?.name || 'Unknown Subject'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {sub?.code}
                            </span>
                          </div>
                        </td>

                        {/* Arabic Title */}
                        <td className="px-5 py-3.5">
                          <span className="font-arabic font-bold text-teal-800 text-sm">
                            {sub?.arabicName || '—'}
                          </span>
                        </td>

                        {/* INLINE TEACHER SELECTOR DROPDOWN */}
                        <td className="px-5 py-3.5">
                          <div className="relative max-w-xs">
                            <select
                              value={asg.teacherId || ''}
                              onChange={(e) => handleInlineTeacherChange(asg.id, e.target.value)}
                              disabled={isSaving}
                              className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50/50 text-slate-900 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                            >
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{asg.teacher?.name}</span>
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenConfigModal(asg)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Configure available classes in month"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveSubjectFromClass(asg)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={`Remove from Class ${selectedClass?.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {searchQuery
                            ? `No subjects match "${searchQuery}" in Class ${selectedClass?.name}`
                            : `No subjects assigned to Class ${selectedClass?.name} yet`}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Subjects in our system are class-specific. You can add subjects specifically for Class {selectedClass?.name} or copy them from another class.
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-3">
                          <button
                            onClick={handleOpenAddModal}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Subject to Class {selectedClass?.name}</span>
                          </button>
                          <button
                            onClick={() => {
                              setCopySourceClassId(
                                classes.find((c) => c.id !== selectedClassId)?.id || ''
                              );
                              setIsCopyModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200"
                          >
                            <Copy className="w-3.5 h-3.5 text-brand-600" />
                            <span>Copy From Another Class</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 5. ADD SUBJECT TO CLASS MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Subject to Class ${selectedClass?.name}`}
      >
        <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setAddMode('new')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                addMode === 'new'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create New Subject for Class {selectedClass?.name}
            </button>
            <button
              type="button"
              onClick={() => setAddMode('existing')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                addMode === 'existing'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pick from Existing Catalog ({availableCatalogSubjects.length})
            </button>
          </div>

          {addMode === 'new' ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Subject Name (English)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alfiya / Tafsir / Fiqh"
                  value={newSubjectData.name}
                  onChange={(e) =>
                    setNewSubjectData({ ...newSubjectData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold focus:border-brand-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Arabic Subject Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ألفية ابن مالك / فتح المعين"
                  value={newSubjectData.arabicName}
                  onChange={(e) =>
                    setNewSubjectData({ ...newSubjectData, arabicName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-arabic focus:border-brand-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectData.code}
                    onChange={(e) =>
                      setNewSubjectData({ ...newSubjectData, code: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Assign Usthad
                  </label>
                  <select
                    required
                    value={newSubjectData.teacherId}
                    onChange={(e) =>
                      setNewSubjectData({ ...newSubjectData, teacherId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Usthad --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-[11px] text-brand-800">
                This subject will be added <strong>only to Class {selectedClass?.name}</strong>. It will not appear in other classes.
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {availableCatalogSubjects.length > 0 ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Select Subject to Add
                    </label>
                    <select
                      required
                      value={existingSubjectId}
                      onChange={(e) => setExistingSubjectId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Choose from Catalog --</option>
                      {availableCatalogSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.arabicName || s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Assign Usthad for Class {selectedClass?.name}
                    </label>
                    <select
                      required
                      value={existingTeacherId}
                      onChange={(e) => setExistingTeacherId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Choose Usthad --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    All existing catalog subjects are already in this class!
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Switch to the <strong>"Create New Subject"</strong> tab above to create a brand new subject specifically for Class {selectedClass?.name}.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addSaving || (addMode === 'existing' && availableCatalogSubjects.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{addSaving ? 'Saving...' : `Add to Class ${selectedClass?.name}`}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. COPY ASSIGNMENTS FROM CLASS MODAL */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Subject Assignments From Another Class"
      >
        <form onSubmit={handleCopySubmit} className="space-y-4">
          <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Instant Class Curriculum Cloning</p>
              <p className="text-[11px] text-brand-700 mt-0.5">
                Copy all subjects and assigned Usthads from another class into{' '}
                <strong>Class {selectedClass?.name}</strong> in 1 click!
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

      {/* 7. AVAILABLE CLASSES CONFIG MODAL */}
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
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md"
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