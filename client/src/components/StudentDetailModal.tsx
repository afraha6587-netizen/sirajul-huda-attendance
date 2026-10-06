import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Plus, Trash2, Calendar, Phone, ShieldAlert, Award } from 'lucide-react';
import api from '../utils/api';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose }) => {
  const [student, setStudent] = useState<any>(null);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingRemark, setSavingRemark] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!studentId) return;

    setLoading(true);
    setErrorMsg('');

    Promise.all([
      api.get(`/students/${studentId}`),
      api.get(`/students/${studentId}/remarks`),
    ])
      .then(([studentRes, remarksRes]) => {
        setStudent(studentRes.data);
        setRemarks(remarksRes.data);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.response?.data?.error || 'Failed to load student details');
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim() || !studentId) return;

    setSavingRemark(true);
    try {
      const res = await api.post(`/students/${studentId}/remarks`, { remark: newRemark });
      setRemarks([res.data, ...remarks]);
      setNewRemark('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save remark');
    } finally {
      setSavingRemark(false);
    }
  };

  const handleDeleteRemark = async (remarkId: string) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;

    try {
      await api.delete(`/students/remarks/${remarkId}`);
      setRemarks(remarks.filter((r) => r.id !== remarkId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete remark');
    }
  };

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              #{student?.rollNumber || 'S'}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{student?.name || 'Loading Student...'}</h2>
              <p className="text-xs text-brand-300 font-bold">
                Reg: <span className="text-white">{student?.registerNumber}</span> • Class:{' '}
                <span className="text-white">{student?.class?.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-brand-600 font-bold text-xs animate-pulse">
              Loading student profile & remarks...
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold">{errorMsg}</div>
          ) : (
            <>
              {/* Student Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Admission Number
                  </span>
                  <span className="font-extrabold text-slate-800">{student?.admissionNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Student Phone
                  </span>
                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {student?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Parent Phone (WhatsApp)
                  </span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {student?.parentPhone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                    Status
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    Active Roster
                  </span>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-600" />
                    <span>Staff Remarks & History ({remarks.length})</span>
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Private to Admin & Usthad
                  </span>
                </div>

                {/* Add Remark Form */}
                <form onSubmit={handleAddRemark} className="flex gap-2">
                  <input
                    type="text"
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Type a new remark for this student (e.g. Needs extra revision in Tajweed)..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={savingRemark || !newRemark.trim()}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{savingRemark ? 'Saving...' : 'Add Remark'}</span>
                  </button>
                </form>

                {/* Remarks List */}
                <div className="space-y-3 pt-2">
                  {remarks.length > 0 ? (
                    remarks.map((r) => {
                      const dateFormatted = new Date(r.createdAt).toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={r.id}
                          className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-xs">{r.remark}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <span className="font-bold text-brand-700">By {r.createdByName || 'Staff'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {dateFormatted}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRemark(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Remark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      No remarks recorded yet for this student. Use the input above to add one.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
