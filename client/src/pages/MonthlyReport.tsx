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
  const [exporting, setExporting] = useState(false);

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

  const handleExportExcel = async () => {
    if (!selectedClassId || !selectedMonthId) return;
    setExporting(true);
    try {
      const res = await api.get('/export/excel', {
        params: { classId: selectedClassId, monthId: selectedMonthId },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const className = reportData?.className || 'Class';
      const monthName = reportData?.monthName || 'Month';
      const year = reportData?.year || '';

      link.setAttribute('download', `Attendance_Report_Class_${className}_${monthName}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export Excel report. Please try again.');
    } finally {
      setExporting(false);
    }
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
              disabled={exporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Generating Excel...' : 'Export Excel (.xlsx)'}</span>
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
            {/* Vibrant Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <img src="/logo.png" alt="College Logo" className="w-16 h-16 object-contain bg-white rounded-2xl p-1.5 shadow-lg shrink-0" />
                <div>
                  <h2 className="text-xs font-extrabold text-brand-400 uppercase tracking-wider">
                    SIRAJUL HUDA COLLEGE OF SCIENCE AND INTEGRATED STUDIES, NADAPURAM
                  </h2>
                  <p className="text-[11px] text-slate-300 font-semibold">Affiliated to Jamiathul Hind Al Islamiya</p>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                    CLASS {reportData.className} — ATTENDANCE REPORT FOR {reportData.monthName.toUpperCase()} {reportData.year}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold">
                      Academic Year {reportData.academicYearName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Net Working Days: {reportData.workingDays} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Performance Summary Pills */}
              <div className="no-print grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Enrolled Students</span>
                  <span className="text-lg font-black text-white">{reportData.students.length}</span>
                </div>
                <div className="bg-amber-950/60 rounded-xl p-3 border border-amber-800/60 text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Low Attendance</span>
                  <span className="text-lg font-black text-amber-300">
                    {reportData.students.filter((s) => s.isAtRisk).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Student Attendance Table (Swipable on mobile) */}
            <div className="overflow-x-auto touch-auto rounded-xl border border-slate-300 shadow-xs">
              <table className="w-full text-center border-collapse text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="border border-slate-700 px-3 py-3 w-12" rowSpan={2}>
                      SL NO
                    </th>
                    <th className="border border-slate-700 px-3 py-3 w-16" rowSpan={2}>
                      R.NO
                    </th>
                    <th className="border border-slate-700 px-4 py-3 text-left min-w-[180px]" rowSpan={2}>
                      STUDENT NAME
                    </th>

                    {/* Dynamic Subject Header Columns */}
                    {reportData.subjectSummaries.map((sub) => (
                      <th
                        key={sub.classSubjectId}
                        className="border border-slate-700 px-3 py-2 bg-indigo-900/90 text-indigo-100"
                        colSpan={2}
                      >
                        <div className="font-extrabold">{sub.subjectName}</div>
                        <div className="font-arabic font-normal text-[10px] text-indigo-300">
                          {sub.arabicName}
                        </div>
                      </th>
                    ))}

                    {/* Grand Total Column Header */}
                    <th className="border border-slate-700 px-3 py-2 bg-emerald-900 text-emerald-100" colSpan={2}>
                      GRAND TOTAL
                    </th>

                    {/* Day Wise Column Header */}
                    <th className="border border-slate-700 px-3 py-2 bg-brand-900 text-brand-100" colSpan={2}>
                      DAY WISE
                    </th>
                  </tr>

                  {/* Sub-headers for Attended & Percentage */}
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {reportData.subjectSummaries.map((sub) => (
                      <React.Fragment key={sub.classSubjectId}>
                        <th className="border border-slate-300 px-2 py-1.5 bg-slate-100">ATT</th>
                        <th className="border border-slate-300 px-2 py-1.5 bg-teal-100 text-teal-900">%</th>
                      </React.Fragment>
                    ))}
                    <th className="border border-slate-300 px-2 py-1.5 bg-emerald-100 text-emerald-950">ATT</th>
                    <th className="border border-slate-300 px-2 py-1.5 bg-emerald-200 text-emerald-950">%</th>

                    <th className="border border-slate-300 px-2 py-1.5 bg-brand-100 text-brand-950">PRES / LEAVE</th>
                    <th className="border border-slate-300 px-2 py-1.5 bg-brand-200 text-brand-950">%</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  {reportData.students.map((st) => (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-slate-50 transition-colors ${
                        st.isAtRisk ? 'bg-amber-50/70' : 'even:bg-slate-50/40'
                      }`}
                    >
                      <td className="border border-slate-200 px-3 py-2.5 font-bold text-slate-500">
                        {st.slNo}
                      </td>
                      <td className="border border-slate-200 px-3 py-2.5 font-bold text-brand-700">
                        {st.registerNumber}
                      </td>
                      <td className="border border-slate-200 px-4 py-2.5 text-left font-extrabold text-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span>{st.studentName}</span>
                          {st.isAtRisk && (
                            <span className="no-print px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs">
                              Low %
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject Attendance Cells */}
                      {st.subjectStats.map((subStat) => (
                        <React.Fragment key={subStat.classSubjectId}>
                          <td className="border border-slate-200 px-2 py-2.5 font-bold text-slate-800">
                            {subStat.attended}
                          </td>
                          <td
                            className={`border border-slate-200 px-2 py-2.5 font-black ${
                              subStat.percentage < reportData.threshold
                                ? 'text-rose-700 bg-rose-100/70'
                                : 'text-teal-800 bg-teal-50/60'
                            }`}
                          >
                            {subStat.percentage}%
                          </td>
                        </React.Fragment>
                      ))}

                      {/* Grand Total Cells */}
                      <td className="border border-slate-200 px-3 py-2.5 font-black bg-emerald-50/60 text-emerald-950">
                        {st.grandTotalAttended}
                      </td>
                      <td
                        className={`border border-slate-200 px-3 py-2.5 font-black text-sm ${
                          st.overallPercentage < reportData.threshold
                            ? 'text-rose-700 bg-rose-100/90'
                            : 'text-emerald-900 bg-emerald-100/70'
                        }`}
                      >
                        {st.overallPercentage}%
                      </td>

                      {/* Day Wise Attendance Cells */}
                      <td className="border border-slate-200 px-3 py-2.5 font-bold bg-brand-50/50">
                        <span className="text-emerald-700 font-black">{st.presentDays} P</span> /{' '}
                        <span className="text-rose-600 font-black">{st.monthlyLeave} L</span>
                      </td>
                      <td
                        className={`border border-slate-200 px-3 py-2.5 font-black text-sm ${
                          st.dayWisePercentage < reportData.threshold
                            ? 'text-rose-700 bg-rose-100/90'
                            : 'text-brand-900 bg-brand-100/70'
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>SUBJECT SUMMARY & USTHAD / TEACHER BREAKDOWN</span>
                </h3>
              </div>

              <div className="overflow-x-auto touch-auto rounded-xl border border-slate-300">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                  <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <tr>
                      <th className="border border-slate-700 px-4 py-3 w-12 text-center">SL NO</th>
                      <th className="border border-slate-700 px-4 py-3">SUBJECT NAME</th>
                      <th className="border border-slate-700 px-4 py-3">USTHAD / TEACHER</th>
                      <th className="border border-slate-700 px-4 py-3 text-center bg-slate-800">AVAILABLE CLASS</th>
                      <th className="border border-slate-700 px-4 py-3 text-center bg-emerald-900 text-emerald-200">TAKEN CLASS</th>
                      <th className="border border-slate-700 px-4 py-3 text-center bg-rose-900 text-rose-200">
                        N'T TAKEN
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                    {reportData.subjectSummaries.map((sub) => (
                      <tr key={sub.classSubjectId} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-4 py-2.5 text-center font-bold text-slate-500">
                          {sub.slNo}
                        </td>
                        <td className="border border-slate-200 px-4 py-2.5 font-bold text-slate-900">
                          {sub.subjectName}{' '}
                          <span className="font-arabic font-normal text-teal-700 text-sm ml-2">
                            ({sub.arabicName})
                          </span>
                        </td>
                        <td className="border border-slate-200 px-4 py-2.5 font-bold text-brand-700">
                          {sub.teacherName}
                        </td>
                        <td className="border border-slate-200 px-4 py-2.5 text-center font-bold text-slate-700">
                          {sub.availableClasses}
                        </td>
                        <td className="border border-slate-200 px-4 py-2.5 text-center font-extrabold text-emerald-800 bg-emerald-50">
                          {sub.takenClasses}
                        </td>
                        <td className="border border-slate-200 px-4 py-2.5 text-center font-extrabold text-rose-700 bg-rose-50">
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
