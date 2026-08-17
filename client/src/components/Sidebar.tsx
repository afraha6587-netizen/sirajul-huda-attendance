import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  CheckSquare,
  CalendarCheck,
  FileSpreadsheet,
  AlertTriangle,
  Upload,
  Settings,
  Link2,
  LogOut,
  ChevronRight,
  Shield,
  Search,
  Palmtree,
  FileText,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [collegeName, setCollegeName] = useState<string>('Sirajul Huda College');

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data?.collegeName) {
          setCollegeName('Sirajul Huda College');
        }
      })
      .catch(() => {});
  }, []);

  const adminNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Classes', path: '/classes', icon: GraduationCap },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
    { label: 'Teachers', path: '/teachers', icon: UserCheck },
    { label: 'Class Assignments', path: '/class-assignments', icon: Link2 },
    { label: 'Mark Attendance', path: '/mark-attendance', icon: CheckSquare },
    { label: 'Daily Attendance', path: '/daily-attendance', icon: CalendarCheck },
    { label: 'Syllabus Log', path: '/syllabus-log', icon: FileText },
    { label: 'Calendar & Holidays', path: '/holidays', icon: Palmtree },
    { label: 'Academic Years', path: '/academic-years', icon: Calendar },
    { label: 'Monthly Report', path: '/monthly-report', icon: FileSpreadsheet },
    { label: 'Students at Risk', path: '/at-risk', icon: AlertTriangle },
    { label: 'Import / Export', path: '/import-export', icon: Upload },
    { label: 'User Accounts', path: '/users', icon: Shield },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const teacherNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Mark Attendance', path: '/mark-attendance', icon: CheckSquare },
    { label: 'Daily Attendance', path: '/daily-attendance', icon: CalendarCheck },
    { label: 'Syllabus Log', path: '/syllabus-log', icon: FileText },
    { label: 'Calendar & Holidays', path: '/holidays', icon: Palmtree },
    { label: 'Monthly Report', path: '/monthly-report', icon: FileSpreadsheet },
    { label: 'Students at Risk', path: '/at-risk', icon: AlertTriangle },
  ];

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-600/30 shrink-0">
          🎓
        </div>
        <div className="overflow-hidden">
          <h1 className="text-white font-extrabold text-sm leading-tight truncate">Sirajul Huda College</h1>
          <p className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider mt-0.5">Attendance System</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Public Access
        </div>

        <a
          href="/portal"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-brand-300 hover:bg-slate-800/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-brand-400" />
            <span>Student Portal</span>
          </div>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-brand-900/60 text-brand-300 border border-brand-700/50">
            PUBLIC
          </span>
        </a>
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-brand-700/40 border border-brand-500/30 text-brand-300 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate leading-snug">{user?.name}</p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-brand-500/20 text-brand-300 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
