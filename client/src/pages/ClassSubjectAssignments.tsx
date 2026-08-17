import { useEffect, useState } from 'react';
import { Plus, Link2, Trash2, Calendar, Settings2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  // Modal State for Assigning
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [formData, setFormData] = useState({ classId: '', subjectId: '', teacherId: '' });

  // Modal State for Available Classes Config
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configAssignment, setConfigAssignment] = useState<ClassSubject | null>(null);
  const [availableClassesInput, setAvailableClassesInput] = useState<number>(23);

  const fetchData = async () => {
    try {
      const [assignRes, clsRes, subRes, tchRes, monthRes] = await Promise.all([
        api.get('/class-subjects', { params: { classId: selectedClassId } }),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers'),
        api.get('/academic-months'),
      ]);
      setAssignments(assignRes.data);
      setClasses(clsRes.data);
      setSubjects(subRes.data);
      setTeachers(tchRes.data);
      setAcademicMonths(monthRes.data);

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
  }, [selectedClassId]);

  const handleOpenAssignModal = () => {
    setFormData({
      classId: selectedClassId || classes[0]?.id || '',
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/class-subjects', formData);
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign subject');
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    try {
      await api.delete(`/class-subjects/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove assignment');
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
      alert('Available classes configured successfully!');
      setIsConfigModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update available classes');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Class-Subject & Teacher Mapping" subtitle="Assign teachers and configure available classes per subject" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Class */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none min-w-44"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Month for Available Classes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Academic Month</label>
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none min-w-44"
              >
                {academicMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.monthName} {m.year} ({m.workingDays} working days)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenAssignModal}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Subject & Teacher</span>
          </button>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Arabic Name</th>
                  <th className="px-6 py-3.5">Usthad / Teacher Assigned</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.length > 0 ? (
                  assignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-extrabold border border-brand-200">
                          {asg.class?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{asg.subject?.name}</td>
                      <td className="px-6 py-4 font-arabic font-bold text-teal-700 text-sm">
                        {asg.subject?.arabicName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                            {asg.teacher?.name.charAt(0)}
                          </div>
                          <span>{asg.teacher?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenConfigModal(asg)}
                            title="Configure Available Classes for Month"
                            className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 flex items-center gap-1 transition-colors"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>Set Available Classes</span>
                          </button>
                          <button
                            onClick={() => handleRemove(asg.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No subject assignments configured yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Assign Subject Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Subject to Class">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Class</label>
            <select
              required
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Subject</label>
            <select
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.arabicName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Assigned Usthad / Teacher for this Class
            </label>
            <select
              required
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md">
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Available Classes Config Modal */}
      {configAssignment && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={`Set Available Classes for ${configAssignment.subject?.name}`}
        >
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-800 border border-brand-200">
              Configuring available classes for <strong>Class {configAssignment.class?.name}</strong> and subject{' '}
              <strong>{configAssignment.subject?.name}</strong>.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Available Classes Count (Scheduled in Month)
              </label>
              <input
                type="number"
                min="0"
                required
                value={availableClassesInput}
                onChange={(e) => setAvailableClassesInput(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Not Taken Classes will be automatically calculated as: <code>Available - Taken</code>
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md">
                Save Available Classes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
