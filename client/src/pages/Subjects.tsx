import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import api from '../utils/api';
import { Subject } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    arabicName: '',
    code: '',
  });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        name: sub.name,
        arabicName: sub.arabicName || sub.name,
        code: sub.code,
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        arabicName: '',
        code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, formData);
      } else {
        await api.post('/subjects', formData);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Subject Management" subtitle="Manage course subjects and Arabic names" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configured Subjects ({subjects.length})</h2>
            <p className="text-xs text-slate-500">Subjects can be assigned to different teachers for different classes</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading subjects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shadow-xs">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{sub.name}</h3>
                      <p className="text-sm font-arabic font-bold text-brand-700 mt-0.5">{sub.arabicName}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block">
                        Code: {sub.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Assigned to <strong className="text-slate-800">{sub._count?.classSubjects || 0}</strong> class(es)
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Create New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. تفسير الجلالين / Fath Al Muin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Arabic Subject Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. تفسير الجلالين"
              value={formData.arabicName}
              onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-arabic focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Code (Unique)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SUB-TAFSIR"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
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
              {editingSubject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
