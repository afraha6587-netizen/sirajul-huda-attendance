import React from 'react';
import { Calendar } from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { getHijriDateString } from '../utils/hijri';

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle }) => {
  const {
    academicYears,
    academicMonths,
    selectedYearId,
    selectedMonthId,
    selectedDate,
    setSelectedYearId,
    setSelectedMonthId,
    setSelectedDate,
  } = useAcademic();

  const filteredMonths = academicMonths.filter(
    (m) => !selectedYearId || m.academicYearId === selectedYearId
  );
  const displayMonths = filteredMonths.length > 0 ? filteredMonths : academicMonths;

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
      </div>

      {/* Global Academic & Date Selector Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Academic Year Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Year:</span>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="bg-transparent text-xs font-bold text-brand-700 focus:outline-none cursor-pointer"
          >
            {academicYears.length === 0 ? (
              <option value="">2026-2027 (Active)</option>
            ) : (
              academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.name} {yr.isCurrent ? '(Active)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Academic Month Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Month:</span>
          <select
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {displayMonths.length === 0 ? (
              <option value="">August 2026</option>
            ) : (
              displayMonths.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.monthName} {m.year}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Active Global Date Picker Calendar */}
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-1.5 text-brand-900">
          <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-black text-brand-950 focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-[9px] font-semibold text-teal-700 leading-tight">
              🌙 {getHijriDateString(selectedDate)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
