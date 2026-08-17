import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { Navbar } from '../components/Navbar';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-surface-bg flex items-center justify-center p-8 min-h-screen">
        <div className="flex items-center gap-3 text-brand-600 font-bold text-sm animate-pulse">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { title: 'Total Classes', value: stats?.totalClasses || 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Total Subjects', value: stats?.totalSubjects || 0, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Active Teachers', value: stats?.totalTeachers || 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Dashboard" subtitle="Overview of college attendance and academic status" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{card.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Banner */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Active Academic Term: {stats?.activeMonthName || 'July 2026'}</span>
            </div>
            <h2 className="text-xl font-extrabold mt-1">Ready to mark today's attendance?</h2>
            <p className="text-xs text-brand-100 mt-1 max-w-xl">
              Quickly record subject period attendance or daily student status with live percentage calculations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/mark-attendance"
              className="px-5 py-3 rounded-xl bg-white text-brand-700 font-bold text-xs shadow-md hover:bg-brand-50 flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Mark Session</span>
            </Link>
            <Link
              to="/monthly-report"
              className="px-5 py-3 rounded-xl bg-brand-800/60 hover:bg-brand-800 text-white font-bold text-xs border border-brand-400/30 flex items-center gap-2 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Excel Report</span>
            </Link>
          </div>
        </div>

        {/* Charts & At-Risk Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Attendance Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Class Attendance Average (%)</h3>
                <p className="text-xs text-slate-500">Current month overall attendance comparison across classes</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {stats?.activeMonthName}
              </span>
            </div>

            <div className="h-64 w-full">
              {stats?.classChartData && stats.classChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.classChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="className" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF' }}
                      formatter={(val: any) => [`${val}%`, 'Average Attendance']}
                    />
                    <Bar dataKey="percentage" fill="#0D9488" radius={[8, 8, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No chart data available for current month
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics & Risk Alert */}
          <div className="space-y-6">
            {/* Warning Card */}
            <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200/80 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-md">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Attendance Warning Threshold</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    System threshold is set to <span className="font-bold">{stats?.threshold}%</span>. Students below this limit require attention.
                  </p>
                </div>
              </div>
              <Link
                to="/at-risk"
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View Low Attendance Students</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Configured Classes Summary */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h4 className="text-sm font-bold text-slate-800 mb-3">System Features Checklist</h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dynamic Teacher Assignment per Class + Subject</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Available / Taken / Not Taken Class Calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Excel-like Monthly Report Generator & Export</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Independent Subject & Day-wise Leave Tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Attendance Sessions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Attendance Sessions</h3>
              <p className="text-xs text-slate-500">Latest class subject sessions recorded in system</p>
            </div>
            <Link to="/mark-attendance" className="text-xs font-bold text-brand-600 hover:underline">
              View All Sessions
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Usthad / Teacher</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats?.recentSessions && stats.recentSessions.length > 0 ? (
                  stats.recentSessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{session.date}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold">
                          {session.class?.name}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {session.classSubject?.subject?.name}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {session.classSubject?.teacher?.name}
                      </td>
                      <td className="px-6 py-3.5">Period {session.period}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No attendance sessions recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
