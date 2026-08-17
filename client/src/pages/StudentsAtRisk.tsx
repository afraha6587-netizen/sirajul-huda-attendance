import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import api from '../utils/api';
import { AcademicMonth } from '../types';
import { Navbar } from '../components/Navbar';

export const StudentsAtRisk: React.FC = () => {
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');
  const [atRiskList, setAtRiskList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/academic-months').then((res) => {
      setAcademicMonths(res.data);
      if (res.data.length > 0) setSelectedMonthId(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedMonthId) return;
    setLoading(true);

    api.get('/reports/at-risk', { params: { monthId: selectedMonthId } })
      .then((res) => setAtRiskList(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedMonthId]);

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Students Below Attendance Threshold" subtitle="Monitor students requiring attendance warning or intervention" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-700">Filter Month:</span>
            <select
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
            >
              {academicMonths.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.monthName} {m.year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>At-Risk Students Count: {atRiskList.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Register No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Class</th>
                <th className="px-6 py-3.5">Attended / Total Sessions</th>
                <th className="px-6 py-3.5 text-right">Attendance %</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Evaluating student attendance records...
                  </td>
                </tr>
              ) : atRiskList.length > 0 ? (
                atRiskList.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50 transition-colors bg-rose-50/20">
                    <td className="px-6 py-4 font-bold text-brand-700">{st.registerNumber}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">{st.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        {st.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {st.presentRecords} present out of {st.totalRecords} sessions
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-600 text-base">
                      {st.percentage}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                        Below {st.threshold}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      <span className="font-bold text-slate-700 text-sm">Great news! No students below threshold.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
