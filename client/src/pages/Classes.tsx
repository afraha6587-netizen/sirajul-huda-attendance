import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { Class, AcademicYear } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const Classes: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', academicYearId: '' });

  const fetchData = async () => {
    try {
      const [classRes, yearRes] = await Promise.all([
        api.get('/classes'),
        api.get('/academic-years'),
      ]);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setAcademicYears(Array.isArray(yearRes.data) ? yearRes.data : []);
      if (yearRes.data.length > 0 && !formData.academicYearId) {
        setFormData((prev) => ({ ...prev, academicYearId: yearRes.data[0].id }));
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

  const handleOpenModal = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ name: cls.name, academicYearId: cls.academicYearId });
    } else {
      setEditingClass(null);
      setFormData({ name: '', academicYearId: academicYears[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, formData);
      } else {
        await api.post('/classes', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? All associated student records will be affected.')) return;
    try {
      await api.delete(`/classes/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete class');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Class Management" subtitle="Create and manage college classes (D-3, D-1, HS-1, HS-2, etc.)" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configured Classes ({classes.length})</h2>
            <p className="text-xs text-slate-500">Every class can have unique subject and teacher assignments</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Class</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading classes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-lg shadow-xs">
                      {cls.name.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{cls.name}</h3>
                      <span className="text-xs font-semibold text-slate-500">{cls.academicYear?.name || '2026-2027'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{cls._count?.students || 0} Students</div>
                      <div className="text-[10px] text-slate-400">Enrolled</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{cls._count?.classSubjects || 0} Subjects</div>
                      <div className="text-[10px] text-slate-400">Assigned</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Create New Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Class Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. D-3, D-1, HS-1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Academic Year
            </label>
            <select
              required
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.name} {yr.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
            >
              {editingClass ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
