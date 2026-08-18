import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarCheck,
  FileText,
  Menu,
  X,
  Palmtree,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  Upload,
  Shield,
  Settings,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  Link2,
  LogOut,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mainTabs = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Mark', path: '/mark-attendance', icon: CheckSquare },
    { label: 'Daily', path: '/daily-attendance', icon: CalendarCheck },
    { label: 'Syllabus', path: '/syllabus-log', icon: FileText },
  ];

  const drawerItems = isAdmin
    ? [
        { label: 'Classes', path: '/classes', icon: GraduationCap },
        { label: 'Students', path: '/students', icon: Users },
        { label: 'Subjects', path: '/subjects', icon: BookOpen },
        { label: 'Teachers', path: '/teachers', icon: UserCheck },
        { label: 'Class Assignments', path: '/class-assignments', icon: Link2 },
        { label: 'Calendar & Holidays', path: '/holidays', icon: Palmtree },
        { label: 'Academic Years', path: '/academic-years', icon: Calendar },
        { label: 'Monthly Report', path: '/monthly-report', icon: FileSpreadsheet },
        { label: 'Students at Risk', path: '/at-risk', icon: AlertTriangle },
        { label: 'Import / Export', path: '/import-export', icon: Upload },
        { label: 'User Accounts', path: '/users', icon: Shield },
        { label: 'Settings', path: '/settings', icon: Settings },
      ]
    : [
        { label: 'Calendar & Holidays', path: '/holidays', icon: Palmtree },
        { label: 'Monthly Report', path: '/monthly-report', icon: FileSpreadsheet },
        { label: 'Students at Risk', path: '/at-risk', icon: AlertTriangle },
      ];

  return (
    <>
      {/* Phone Bottom Navigation Bar (Visible only on mobile md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}

        {/* More Drawer Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
            isDrawerOpen ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-xs bg-slate-900 text-slate-300 min-h-full p-5 flex flex-col justify-between shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold text-xs">Sirajul Huda</h3>
                    <p className="text-[10px] text-teal-400 font-semibold">Mobile Menu</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1 overflow-y-auto max-h-[70vh]">
                <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  College Administration
                </p>

                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                <div className="pt-3 px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Public
                </div>

                <a
                  href="/portal"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-teal-300 hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-teal-400" />
                    <span>Student Portal</span>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300">
                    PUBLIC
                  </span>
                </a>
              </div>
            </div>

            {/* Mobile User Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <span className="text-[9px] text-teal-400 uppercase font-extrabold">{user?.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
