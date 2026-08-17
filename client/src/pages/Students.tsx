import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, Phone, Hash, BookOpen, MessageSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Student, Class } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    registerNumber: '',
    rollNumber: 1,
    name: '',
    classId: '',
    admissionNo: '',
    phone: '',
    parentPhone: '',
  });

  // Profile View Modal
  const [profileStudent, setProfileStudent] = useState<any | null>(null);

  const fetchStudents = async () => {
    try {
      const params: any = {};
      if (selectedClassId) params.classId = selectedClassId;
      if (searchTerm) params.search = searchTerm;

      const [stRes, clsRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/classes'),
      ]);

      const studentList = Array.isArray(stRes.data) ? stRes.data : stRes.data?.students || [];
      const classList = Array.isArray(clsRes.data) ? clsRes.data : [];

      setStudents(studentList);
      setClasses(classList);

      if (classList.length > 0 && !formData.classId) {
        setFormData((prev) => ({ ...prev, classId: classList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, searchTerm]);

  const handleOpenModal = (st?: Student) => {
    const defaultClassId = selectedClassId || classes[0]?.id || '';
    if (st) {
      setEditingStudent(st);
      setFormData({
        registerNumber: st.registerNumber,
        rollNumber: st.rollNumber,
        name: st.name,
        classId: st.classId || defaultClassId,
        admissionNo: st.admissionNo || '',
        phone: st.phone || '',
        parentPhone: st.parentPhone || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        registerNumber: '',
        rollNumber: students.length + 1,
        name: '',
        classId: defaultClassId,
        admissionNo: '',
        phone: '',
        parentPhone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId) {
      alert('Please select or create a Class first!');
      return;
    }

    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete student');
    }
  };

  const handleViewProfile = async (id: string) => {
    try {
      const res = await api.get(`/students/${id}`);
      setProfileStudent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Student Management" subtitle="Manage student profiles, register numbers, and parent contacts" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, Reg No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Reg Number</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Parent Contact</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading students...
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">#{st.rollNumber}</td>
                      <td className="px-6 py-4 font-bold text-brand-700">{st.registerNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <button
                          onClick={() => handleViewProfile(st.id)}
                          className="hover:text-brand-600 hover:underline text-left font-bold text-slate-900"
                        >
                          {st.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {st.class?.name || 'Class'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        {st.parentPhone || st.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(st)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(st.id)}
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
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No students found. Click "Add Student" or use "Import / Export" to upload roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Register Number (Unique)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 101"
              value={formData.registerNumber}
              onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Roll Number
              </label>
              <input
                type="number"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Class Assignment
              </label>
              <select
                required
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none font-bold"
              >
                {classes.length > 0 ? (
                  classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.name}
                    </option>
                  ))
                ) : (
                  <option value="">No classes found</option>
                )}
              </select>
            </div>
          </div>

          {classes.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No classes exist yet. Create a class first.</span>
              </div>
              <Link to="/classes" className="px-3 py-1 bg-amber-700 text-white rounded-lg text-[10px] font-bold">
                Add Class
              </Link>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MUHAMMED AFRAH"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Parent WhatsApp Contact
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Student Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
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
              disabled={classes.length === 0}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {editingStudent ? 'Update Student' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Profile Detail Modal */}
      {profileStudent && (
        <Modal
          isOpen={Boolean(profileStudent)}
          onClose={() => setProfileStudent(null)}
          title={`Student Profile: ${profileStudent.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-brand-50 p-4 rounded-2xl border border-brand-200">
              <div className="w-14 h-14 rounded-full bg-brand-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                {profileStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{profileStudent.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 font-semibold">
                  <span>
                    Reg No: <strong className="text-brand-700">{profileStudent.registerNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Roll No: <strong>#{profileStudent.rollNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Class: <strong>{profileStudent.class?.name}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Attendance Session Logs ({profileStudent.attendanceRecords?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {profileStudent.attendanceRecords && profileStudent.attendanceRecords.length > 0 ? (
                  profileStudent.attendanceRecords.map((r: any) => (
                    <div key={r.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{r.session?.classSubject?.subject?.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Date: {r.session?.date} • Teacher: {r.session?.classSubject?.teacher?.name}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">No session attendance records found</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
