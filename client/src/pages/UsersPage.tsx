import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Shield, User, Key, Mail } from 'lucide-react';
import api from '../utils/api';
import { User as UserType } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'TEACHER',
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (usr?: UserType) => {
    if (usr) {
      setEditingUser(usr);
      setFormData({
        name: usr.name,
        email: usr.email,
        password: '',
        role: usr.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'ADMIN',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save user account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user account');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="User & Security Management" subtitle="Manage Administrator & Teacher login accounts and passwords" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">System User Accounts ({users.length})</h2>
            <p className="text-xs text-slate-500">Admins have full access while Teachers can access their assigned subjects</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User Account</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading user accounts...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email / User ID</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{usr.name}</td>
                    <td className="px-6 py-4 font-semibold text-brand-700">{usr.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          usr.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(usr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usr.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create User Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Administrator"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email / User ID (Login Handle)
            </label>
            <input
              type="email"
              required
              placeholder="e.g. admin@college.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password {editingUser ? '(Leave blank to keep current password)' : ''}
            </label>
            <input
              type="password"
              required={!editingUser}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              User Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'TEACHER' })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              <option value="ADMIN">ADMIN (Full Control)</option>
              <option value="TEACHER">TEACHER (Assigned Subjects Only)</option>
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
              {editingUser ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
