import React, { useEffect, useState } from 'react';
import { X, Search, GraduationCap, Users, User, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { StudentDetailModal } from './StudentDetailModal';

interface StudentsListModalProps {
  onClose: () => void;
}

export const StudentsListModal: React.FC<StudentsListModalProps> = ({ onClose }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected student for detail modal
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/students', { params: { classId: selectedClassId || undefined, search: search || undefined } }),
      api.get('/classes'),
    ])
      .then(([studentsRes, classesRes]) => {
        setStudents(studentsRes.data);
        setClasses(classesRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassId, search]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-black">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Active Students Directory</h2>
                <p className="text-xs text-brand-300 font-semibold">
                  Click on any student to view details, attendance statistics, and private remarks
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

          {/* Controls */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, reg no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-brand-600 focus:outline-none min-w-44"
              >
                <option value="">All Classes ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {loading ? (
              <div className="py-12 text-center text-brand-600 font-bold text-xs animate-pulse">
                Loading students roster...
              </div>
            ) : students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setActiveStudentId(st.id)}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 font-black flex items-center justify-center text-xs group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        #{st.rollNumber}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-brand-700 transition-colors">
                          {st.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold">
                          Reg: <span className="font-bold text-brand-700">{st.registerNumber}</span> • Class{' '}
                          <span className="font-bold text-slate-800">{st.class?.name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                No active students found matching criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail & Remarks Modal */}
      {activeStudentId && (
        <StudentDetailModal
          studentId={activeStudentId}
          onClose={() => setActiveStudentId(null)}
        />
      )}
    </>
  );
};
