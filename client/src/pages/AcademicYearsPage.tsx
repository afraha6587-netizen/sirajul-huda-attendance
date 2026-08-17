import React, { useEffect, useState } from 'react';
import { Calendar, Plus, CheckCircle2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { AcademicYear } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { useAcademic } from '../context/AcademicContext';

export const AcademicYearsPage: React.FC = () => {
  const { academicYears, refreshAcademicData, setSelectedYearId } = useAcademic();
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '2027-2028',
    startDate: '2027-06-01',
    endDate: '2028-04-30',
  });

  const handleOpenModal = () => {
    // Auto increment default next year
    const lastYearStr = academicYears[academicYears.length - 1]?.name || '2026-2027';
    const parts = lastYearStr.split('-');
    if (parts.length === 2 && !isNaN(Number(parts[0]))) {
      const nextStart = Number(parts[0]) + 1;
      const nextEnd = Number(parts[1]) + 1;
      setFormData({
        name: `${nextStart}-${nextEnd}`,
        startDate: `${nextStart}-06-01`,
        endDate: `${nextEnd}-04-30`,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/academic-years', formData);
      setIsModalOpen(false);
      await refreshAcademicData();
      alert(`Academic Year ${formData.name} created successfully with 12 initialized months!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create academic year');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveYear = async (yr: AcademicYear) => {
    try {
      // Set active year in database
      await api.post('/academic-years', {
        id: yr.id,
        name: yr.name,
        startDate: yr.startDate,
        endDate: yr.endDate,
        isCurrent: true,
      });

      setSelectedYearId(yr.id);
      await refreshAcademicData();
      alert(`Academic Year ${yr.name} is now the active system year!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to set active academic year');
    }
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Academic Years & Future Planning" subtitle="Create future academic years and switch active year for the college" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Future Academic Year Management</span>
            </div>
            <h2 className="text-xl font-extrabold mt-1">Multi-Year Academic Configuration</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              You can create future academic years (e.g., 2027-2028, 2028-2029) at any time. Creating a year automatically generates 12 months for seamless future planning.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Academic Year</span>
          </button>
        </div>

        {/* Academic Years List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Configured Academic Years ({academicYears.length})</h3>
          </div>

          <div className="divide-y divide-slate-100 font-medium text-slate-700">
            {academicYears.map((yr) => (
              <div
                key={yr.id}
                className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm ${
                      yr.isCurrent
                        ? 'bg-brand-600 text-white shadow-brand-600/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    📅
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900">Academic Year {yr.name}</h4>
                      {yr.isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-200">
                          Active System Year
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      Start Date: <strong className="text-slate-800">{yr.startDate?.split('T')[0]}</strong> • End Date:{' '}
                      <strong className="text-slate-800">{yr.endDate?.split('T')[0]}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  {!yr.isCurrent ? (
                    <button
                      onClick={() => handleSetActiveYear(yr)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Set as Active Year</span>
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Current Active</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create New Academic Year Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Academic Year">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Academic Year Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2027-2028"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-800 border border-brand-200">
            <strong>Automatic Setup:</strong> Creating a new academic year will automatically generate 12 academic months (June to May) with working days configured.
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {loading ? 'Creating Year...' : 'Create Academic Year'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
