import React, { useEffect, useState } from 'react';
import { Download, Printer, FileSpreadsheet, Filter, Sparkles, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { Class, AcademicMonth, MonthlyReportData } from '../types';
import { Navbar } from '../components/Navbar';
import { useAcademic } from '../context/AcademicContext';

export const MonthlyReport: React.FC = () => {
  const { selectedMonthId, setSelectedMonthId } = useAcademic();
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/academic-months')]).then(([clsRes, monthRes]) => {
      const clsList = Array.isArray(clsRes.data) ? clsRes.data : [];
      const mList = Array.isArray(monthRes.data) ? monthRes.data : [];

      setClasses(clsList);
      setAcademicMonths(mList);

      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }

      if (mList.length > 0 && !selectedMonthId) {
        // Find current calendar month e.g. August 2026
        const now = new Date();
        const currentMonthName = now.toLocaleString('default', { month: 'long' }).toLowerCase();
        const matchingMonth = mList.find(
          (m: AcademicMonth) => m.monthName.toLowerCase() === currentMonthName && m.year === now.getFullYear()
        );
        if (matchingMonth) {
          setSelectedMonthId(matchingMonth.id);
        } else {
          setSelectedMonthId(mList[0].id);
        }
      }
    });
  }, []);

  const fetchReport = async () => {
    if (!selectedClassId || !selectedMonthId) return;
    setLoading(true);
    try {
      const res = await api.get('/reports/monthly', {
        params: { classId: selectedClassId, monthId: selectedMonthId },
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedClassId, selectedMonthId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!selectedClassId || !selectedMonthId) return;
    window.location.href = `/api/export/excel?classId=${selectedClassId}&monthId=${selectedMonthId}`;
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <div className="no-print">
        <Navbar title="Monthly Attendance Report" subtitle="Excel-reproduced digital attendance sheet & summary report" />
      </div>

      <main className="max-w-[96rem] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Filters & Export Bar */}
        <div className="no-print bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-700">Select Report Scope:</span>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>

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

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Report</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Report Canvas Container */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs animate-pulse">
            Calculating attendance matrices and generating report...
          </div>
        ) : reportData ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6 report-card">
            {/* Header Title */}
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-sm font-extrabold text-slate-600 uppercase tracking-widest">
                SIRAJUL HUDA COLLEGE OF SCIENCE AND INTEGRATED STUDIES, NADAPURAM
              </h2>
              <p className="text-[11px] font-bold text-slate-500">Affiliated to Jamiathul Hind Al Islamiya</p>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2">
                CLASS {reportData.className} — ATTENDANCE REPORT FOR {reportData.monthName.toUpperCase()} {reportData.year}
              </h1>
              <p className="text-xs font-bold text-brand-700 mt-1">
                Academic Year {reportData.academicYearName} • Total Working Days: {reportData.workingDays}
              </p>
            </div>

            {/* Main Student Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="border border-slate-600 px-3 py-2 w-12" rowSpan={2}>
                      SL NO
                    </th>
                    <th className="border border-slate-600 px-3 py-2 w-16" rowSpan={2}>
                      R.NO
                    </th>
                    <th className="border border-slate-600 px-4 py-2 text-left" rowSpan={2}>
                      STUDENT NAME
                    </th>

                    {/* Dynamic Subject Header Columns */}
                    {reportData.subjectSummaries.map((sub) => (
                      <th
                        key={sub.classSubjectId}
                        className="border border-slate-600 px-3 py-2 bg-slate-700"
                        colSpan={2}
                      >
                        <div className="font-extrabold">{sub.subjectName}</div>
                        <div className="font-arabic font-normal text-[10px] text-brand-300">
                          {sub.arabicName}
                        </div>
                      </th>
                    ))}

                    {/* Grand Total Column Header */}
                    <th className="border border-slate-600 px-3 py-2 bg-brand-900" colSpan={2}>
                      GRAND TOTAL
                    </th>

                    {/* Day Wise Column Header */}
                    <th className="border border-slate-600 px-3 py-2 bg-indigo-900" colSpan={2}>
                      DAY WISE
                    </th>
                  </tr>

                  {/* Sub-headers for Attended & Percentage */}
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {reportData.subjectSummaries.map((sub) => (
                      <React.Fragment key={sub.classSubjectId}>
                        <th className="border border-slate-300 px-2 py-1 bg-slate-50">ATT</th>
                        <th className="border border-slate-300 px-2 py-1 bg-teal-50 text-teal-800">%</th>
                      </React.Fragment>
                    ))}
                    <th className="border border-slate-300 px-2 py-1 bg-brand-100 text-brand-900">ATT</th>
                    <th className="border border-slate-300 px-2 py-1 bg-brand-200 text-brand-950">%</th>

                    <th className="border border-slate-300 px-2 py-1 bg-indigo-100 text-indigo-900">PRES / LEAVE</th>
                    <th className="border border-slate-300 px-2 py-1 bg-indigo-200 text-indigo-950">%</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  {reportData.students.map((st) => (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        st.isAtRisk ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="border border-slate-200 px-3 py-2 font-bold text-slate-500">
                        {st.slNo}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-bold text-brand-700">
                        {st.registerNumber}
                      </td>
                      <td className="border border-slate-200 px-4 py-2 text-left font-extrabold text-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span>{st.studentName}</span>
                          {st.isAtRisk && (
                            <span className="no-print px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                              Low %
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject Attendance Cells */}
                      {st.subjectStats.map((subStat) => (
                        <React.Fragment key={subStat.classSubjectId}>
                          <td className="border border-slate-200 px-2 py-2 font-bold">
                            {subStat.attended}
                          </td>
                          <td
                            className={`border border-slate-200 px-2 py-2 font-black ${
                              subStat.percentage < reportData.threshold
                                ? 'text-rose-600 bg-rose-50/60'
                                : 'text-teal-700 bg-teal-50/30'
                            }`}
                          >
                            {subStat.percentage}%
                          </td>
                        </React.Fragment>
                      ))}

                      {/* Grand Total Cells */}
                      <td className="border border-slate-200 px-3 py-2 font-black bg-brand-50/50 text-brand-900">
                        {st.grandTotalAttended}
                      </td>
                      <td
                        className={`border border-slate-200 px-3 py-2 font-black text-sm ${
                          st.overallPercentage < reportData.threshold
                            ? 'text-rose-600 bg-rose-100/60'
                            : 'text-brand-800 bg-brand-100/50'
                        }`}
                      >
                        {st.overallPercentage}%
                      </td>

                      {/* Day Wise Attendance Cells */}
                      <td className="border border-slate-200 px-3 py-2 font-bold bg-indigo-50/40">
                        <span className="text-emerald-700">{st.presentDays} P</span> /{' '}
                        <span className="text-rose-600">{st.monthlyLeave} L</span>
                      </td>
                      <td
                        className={`border border-slate-200 px-3 py-2 font-black text-sm ${
                          st.dayWisePercentage < reportData.threshold
                            ? 'text-rose-600 bg-rose-100/60'
                            : 'text-indigo-900 bg-indigo-100/50'
                        }`}
                      >
                        {st.dayWisePercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subject Summary Breakdown Table */}
            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                SUBJECT SUMMARY & USTHAD / TEACHER BREAKDOWN
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="border border-slate-300 px-4 py-2 w-12 text-center">SL NO</th>
                      <th className="border border-slate-300 px-4 py-2">SUBJECT NAME</th>
                      <th className="border border-slate-300 px-4 py-2">USTHAD / TEACHER</th>
                      <th className="border border-slate-300 px-4 py-2 text-center">AVAILABLE CLASS</th>
                      <th className="border border-slate-300 px-4 py-2 text-center">TAKEN CLASS</th>
                      <th className="border border-slate-300 px-4 py-2 text-center text-rose-700">
                        N'T TAKEN
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                    {reportData.subjectSummaries.map((sub) => (
                      <tr key={sub.classSubjectId} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-4 py-2 text-center font-bold text-slate-500">
                          {sub.slNo}
                        </td>
                        <td className="border border-slate-200 px-4 py-2 font-bold text-slate-900">
                          {sub.subjectName}{' '}
                          <span className="font-arabic font-normal text-teal-700 text-sm ml-2">
                            ({sub.arabicName})
                          </span>
                        </td>
                        <td className="border border-slate-200 px-4 py-2 font-bold text-brand-700">
                          {sub.teacherName}
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center font-bold">
                          {sub.availableClasses}
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center font-extrabold text-emerald-700 bg-emerald-50/40">
                          {sub.takenClasses}
                        </td>
                        <td className="border border-slate-200 px-4 py-2 text-center font-extrabold text-rose-600 bg-rose-50/40">
                          {sub.notTakenClasses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs">
            No report data available for the selected filters
          </div>
        )}
      </main>
    </div>
  );
};
