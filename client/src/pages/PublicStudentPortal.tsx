import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Calendar, CheckCircle2, AlertTriangle, ArrowLeft, BookOpen, Clock, ShieldCheck, Printer, FileCheck } from 'lucide-react';
import api from '../utils/api';
import { AcademicMonth } from '../types';
import { getHijriDateString } from '../utils/hijri';

export const PublicStudentPortal: React.FC = () => {
  const [registerNumber, setRegisterNumber] = useState('');
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState('');
  const [studentData, setStudentData] = useState<any | null>(null);
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Public fetch academic months
    api.get('/public/academic-months').then((res) => {
      setAcademicMonths(res.data);
      if (res.data.length > 0) setSelectedMonthId(res.data[0].id);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerNumber.trim()) return;

    setLoading(true);
    setError('');
    setStudentData(null);
    setShowCertificate(false);

    try {
      const res = await api.get('/public/student-attendance', {
        params: {
          registerNumber: registerNumber.trim(),
          monthId: selectedMonthId,
        },
      });
      setStudentData(res.data);

      // Also pre-fetch Certificate payload
      if (res.data.student?.id) {
        const certRes = await api.get(`/students/${res.data.student.id}/certificate`, {
          params: { monthId: selectedMonthId },
        });
        setCertificateData(certRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to find attendance records for this Register Number');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Public Header Bar */}
      <header className="no-print bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-20 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-brand-600/30 shrink-0">
            🎓
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
              Sirajul Huda College of Science & Integrated Studies
            </h1>
            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
              Nadapuram • Jamiathul Hind Al Islamiya • Public Portal
            </p>
          </div>
        </div>

        <a
          href="/login"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 flex items-center gap-2 shrink-0"
        >
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span className="hidden sm:inline">Faculty Login</span>
        </a>
      </header>

      {/* Printable Certificate Modal/View */}
      {showCertificate && certificateData ? (
        <div className="p-8 max-w-4xl mx-auto w-full bg-white text-slate-900 rounded-3xl shadow-2xl space-y-6 border-4 border-double border-slate-900 my-8">
          <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={() => setShowCertificate(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Scorecard
            </button>
            <button
              onClick={handlePrintCertificate}
              className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Certificate (A4)
            </button>
          </div>

          {/* Certificate Body */}
          <div className="text-center space-y-3 pt-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-md">
              🎓
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {certificateData.collegeName}
            </h1>
            <p className="text-xs font-extrabold uppercase text-slate-600">
              Affiliated to {certificateData.university}
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest mt-2">
              ATTENDANCE NOC & PERFORMANCE CERTIFICATE
            </div>
          </div>

          <div className="pt-4 text-center text-xs font-semibold text-slate-700 space-y-2">
            <p className="text-sm">
              This is to certify that student <strong className="text-slate-950 font-black text-base">{certificateData.student?.name}</strong> (Register No: <strong>{certificateData.student?.registerNumber}</strong>, Roll No: #{certificateData.student?.rollNumber}) of Class <strong className="text-slate-950 font-extrabold">{certificateData.student?.className}</strong> has secured an overall attendance performance of:
            </p>
            <div className="text-4xl font-black text-slate-900 py-3">
              {certificateData.overallPercentage}%
            </div>
            <p className="text-xs">
              During academic month <strong>{certificateData.monthName} {certificateData.year}</strong> (Total Working Days: {certificateData.workingDays}).
            </p>
          </div>

          {/* Subject Breakdown Table */}
          <div className="pt-4">
            <table className="w-full text-center border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="border border-slate-700 px-3 py-2 text-left">Subject Name</th>
                  <th className="border border-slate-700 px-3 py-2">Usthad / Teacher</th>
                  <th className="border border-slate-700 px-3 py-2">Attended</th>
                  <th className="border border-slate-700 px-3 py-2">Total Taken</th>
                  <th className="border border-slate-700 px-3 py-2">Percentage %</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-800">
                {certificateData.subjectBreakdown.map((sb: any, i: number) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="border border-slate-300 px-3 py-2 text-left font-bold">{sb.subjectName} ({sb.arabicName})</td>
                    <td className="border border-slate-300 px-3 py-2">{sb.teacherName}</td>
                    <td className="border border-slate-300 px-3 py-2">{sb.attended}</td>
                    <td className="border border-slate-300 px-3 py-2">{sb.taken}</td>
                    <td className="border border-slate-300 px-3 py-2 font-black">{sb.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Certificate Signatures */}
          <div className="pt-12 grid grid-cols-2 text-center text-xs font-bold border-t border-slate-300">
            <div>
              <div className="h-12"></div>
              <p className="border-t border-slate-400 pt-1 max-w-xs mx-auto text-slate-600 uppercase">
                Usthad / Class Teacher Signature
              </p>
            </div>
            <div>
              <div className="h-12"></div>
              <p className="border-t border-slate-400 pt-1 max-w-xs mx-auto text-slate-900 uppercase font-black">
                Principal & Official College Seal
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Main Container */
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Search Hero Box */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider bg-brand-950/60 px-3 py-1 rounded-full border border-brand-800/50 inline-block mb-3">
                Official Student Search
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sirajul Huda College Attendance Lookup
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your official Register Number, Roll Number, or Name to check subject performance and day-wise leave.
              </p>
            </div>

            <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter Register No or Roll No (e.g. 101)"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-semibold focus:border-brand-500 focus:outline-none transition-all"
                />
              </div>

              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-white text-sm font-semibold focus:border-brand-500 focus:outline-none"
              >
                {academicMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.monthName} {m.year}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Searching...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Attendance</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Student Attendance Scorecard */}
          {studentData && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Student Info Card */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600/30 border border-brand-500/40 text-brand-300 font-black text-2xl flex items-center justify-center shadow-inner">
                    {studentData.student?.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{studentData.student?.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-semibold">
                      <span>
                        Register No: <strong className="text-brand-400">{studentData.student?.registerNumber}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Roll No: <strong>#{studentData.student?.rollNumber}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Class: <strong className="text-slate-200">{studentData.student?.className}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overall Percentage Badge & Certificate CTA */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Print Attendance NOC Certificate</span>
                  </button>

                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Attendance</p>
                    <div className="text-3xl font-black text-white mt-0.5">
                      {studentData.overallPercentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Working Days</p>
                  <h4 className="text-2xl font-extrabold text-white mt-1">{studentData.workingDays} Days</h4>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Day-Wise Present</p>
                  <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{studentData.presentDaysCount} Days</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Day-wise %: {studentData.dayWisePercentage}%</p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Monthly Leave / Absences</p>
                  <h4 className="text-2xl font-extrabold text-rose-400 mt-1">{studentData.monthlyLeave} Days</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Working Days - Present Days</p>
                </div>
              </div>

              {/* Subject Breakdown Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-400" />
                  <span>Subject Attendance Breakdown ({studentData.monthName} {studentData.year})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentData.subjectBreakdown.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-white">{sub.subjectName}</h4>
                          <p className="text-xs font-arabic text-teal-400 font-bold">{sub.arabicName}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Usthad: {sub.teacherName}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-brand-400">{sub.percentage}%</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Attended: <strong className="text-white">{sub.attendedCount}</strong></span>
                        <span>Taken: <strong className="text-white">{sub.takenClasses}</strong></span>
                        <span>Available: <strong className="text-slate-300">{sub.availableClasses}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Logs History */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Attendance Session Logs ({studentData.sessionLogs?.length || 0})
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Hijri Date</th>
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3">Teacher</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                      {studentData.sessionLogs && studentData.sessionLogs.length > 0 ? (
                        studentData.sessionLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-850">
                            <td className="px-5 py-3 text-white font-bold">{log.session?.date}</td>
                            <td className="px-5 py-3 text-teal-400 font-bold">{getHijriDateString(log.session?.date)}</td>
                            <td className="px-5 py-3 font-bold text-teal-300">
                              {log.session?.classSubject?.subject?.name}
                            </td>
                            <td className="px-5 py-3 text-slate-400">
                              {log.session?.classSubject?.teacher?.name}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.status === 'PRESENT'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-slate-500">
                            No specific session logs recorded for this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
};
