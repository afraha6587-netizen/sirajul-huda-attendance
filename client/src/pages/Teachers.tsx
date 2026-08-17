import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, UserCheck, Mail, Shield, BookOpen } from 'lucide-react';
import api from '../utils/api';
import { Teacher } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    password: '',
  });

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenModal = (tch?: Teacher) => {
    if (tch) {
      setEditingTeacher(tch);
      setFormData({
        name: tch.name,
        code: tch.code,
        email: tch.user?.email || '',
        password: '',
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        code: `TCH-${Math.floor(100 + Math.random() * 900)}`,
        email: '',
        password: 'teacher123',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, formData);
      } else {
        await api.post('/teachers', formData);
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save teacher');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      fetchTeachers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete teacher');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Teacher / Usthad Management" subtitle="Manage teaching faculty and login credentials" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Faculty & Teachers ({teachers.length})</h2>
            <p className="text-xs text-slate-500">Each teacher can log in and manage attendance for their assigned subjects</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading teachers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((tch) => (
              <div
                key={tch.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-xs">
                      {tch.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{tch.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block">
                        Code: {tch.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(tch)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tch.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {tch.user?.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tch.user.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Assigned Subjects: <strong className="text-slate-800">{tch.classSubjects?.length || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Full Name (Usthad / Teacher Name)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ZAINUL ABID BUKHARI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Teacher Code (Unique)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TCH-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Teacher Login Account (Optional)</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. zainul@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password {editingTeacher ? '(Leave blank to keep unchanged)' : ''}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
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
              {editingTeacher ? 'Update Teacher' : 'Save Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
