import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Palmtree,
  Home,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../utils/api';
import { AcademicMonth, AcademicYear } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const HolidaysPage: React.FC = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicMonths, setAcademicMonths] = useState<AcademicMonth[]>([]);

  // Selectors
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedMonthId, setSelectedMonthId] = useState<string>('');

  // Month Calendar Data
  const [calendarGridData, setCalendarGridData] = useState<any | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Declaring Leave/Holiday
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    type: 'HOSTEL_LEAVE',
    academicYearId: '',
    monthId: '',
  });

  // Selected Day Detail Drawer Modal
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);

  // 1. Initial fetch Academic Years & Months
  useEffect(() => {
    Promise.all([api.get('/academic-years'), api.get('/academic-months')]).then(([yrRes, mRes]) => {
      setAcademicYears(yrRes.data);
      setAcademicMonths(mRes.data);

      if (yrRes.data.length > 0) setSelectedYearId(yrRes.data[0].id);
      if (mRes.data.length > 0) setSelectedMonthId(mRes.data[0].id);
    });
  }, []);

  // 2. Fetch Month Calendar Grid & Holidays when Year/Month selection changes
  const fetchCalendarGrid = async () => {
    if (!selectedMonthId) return;
    setLoading(true);

    try {
      const [gridRes, holRes] = await Promise.all([
        api.get('/calendar/month-grid', { params: { monthId: selectedMonthId } }),
        api.get('/holidays', { params: { monthId: selectedMonthId } }),
      ]);
      setCalendarGridData(gridRes.data);
      setHolidays(holRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarGrid();
  }, [selectedMonthId]);

  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    const monthsForYear = academicMonths.filter((m) => m.academicYearId === yearId);
    if (monthsForYear.length > 0) {
      setSelectedMonthId(monthsForYear[0].id);
    }
  };

  const handleOpenModal = (presetDate?: string) => {
    const defaultDate = presetDate || new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      startDate: defaultDate,
      endDate: defaultDate,
      type: 'HOSTEL_LEAVE',
      academicYearId: selectedYearId || academicYears[0]?.id || '',
      monthId: selectedMonthId || academicMonths[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/holidays', formData);
      setIsModalOpen(false);
      fetchCalendarGrid();
      alert('Leave / Holiday declared and monthly working days updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to declare holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this leave declaration?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchCalendarGrid();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete holiday');
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Pad empty cells for starting weekday alignment
  const emptyPaddingCells = calendarGridData ? Array(calendarGridData.firstDayWeekday).fill(null) : [];

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Academic Calendar & Leave System" subtitle="Select Academic Year & Month to manage working days, Sundays, and Hostel Leave" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top Controls: Academic Year & Month Selectors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* 1. Academic Year Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Academic Year
              </label>
              <select
                value={selectedYearId}
                onChange={(e) => handleYearChange(e.target.value)}
                className="px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none min-w-44"
              >
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    Academic Year {yr.name} {yr.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Academic Month Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Academic Month
              </label>
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-4 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none min-w-48"
              >
                {academicMonths
                  .filter((m) => !selectedYearId || m.academicYearId === selectedYearId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.monthName} {m.year} ({m.workingDays} Net Working Days)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Declare Hostel Leave / Holiday</span>
          </button>
        </div>

        {/* Month Summary Metrics Bar */}
        {calendarGridData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Month Days</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{calendarGridData.totalDaysInMonth} Days</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Sundays (Weekly Off)</span>
              <div className="text-xl font-extrabold text-rose-600 mt-1">{calendarGridData.sundayCount} Days</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Hostel Monthly Leave</span>
              <div className="text-xl font-extrabold text-purple-700 mt-1">{calendarGridData.hostelLeaveCount} Days</div>
            </div>

            <div className="bg-brand-600 text-white rounded-2xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider">Net Working Days</span>
              <div className="text-xl font-black mt-1">{calendarGridData.workingDays} Days</div>
            </div>
          </div>
        )}

        {/* Full Interactive Month Calendar Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Month Header Banner */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-lg">
                📅
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {calendarGridData?.monthName} {calendarGridData?.year} Calendar
                </h2>
                <p className="text-xs text-brand-300 font-semibold">
                  Sirajul Huda College • Academic Year {calendarGridData?.academicYearName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Sunday
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Hostel Leave
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-950/80 text-brand-300 border border-brand-800">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span> Working Day
              </span>
            </div>
          </div>

          {/* Weekday Grid Headers */}
          <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">
            {weekdays.map((wd, i) => (
              <div key={wd} className={i === 0 ? 'text-rose-600 font-extrabold' : ''}>
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid Cells */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs animate-pulse">
              Loading calendar grid for {calendarGridData?.monthName}...
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50/50">
              {/* Empty padding cells for start weekday */}
              {emptyPaddingCells.map((_, idx) => (
                <div key={`empty-${idx}`} className="h-28 bg-slate-100/40 p-2"></div>
              ))}

              {/* Real Month Calendar Day Cells */}
              {calendarGridData?.calendarDays?.map((day: any) => {
                const isSun = day.isSunday;
                const isHostelLeave = day.holidayType === 'HOSTEL_LEAVE';
                const isHoliday = day.isHoliday && !isSun && !isHostelLeave;

                return (
                  <div
                    key={day.dayNumber}
                    onClick={() => setSelectedDayDetail(day)}
                    className={`h-28 p-3 flex flex-col justify-between transition-all cursor-pointer hover:bg-brand-50/80 group border-b border-r border-slate-100 relative ${
                      isSun
                        ? 'bg-rose-50/40'
                        : isHostelLeave
                        ? 'bg-purple-50/50'
                        : isHoliday
                        ? 'bg-teal-50/40'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${
                          isSun
                            ? 'bg-rose-100 text-rose-800'
                            : 'text-slate-800 group-hover:bg-brand-600 group-hover:text-white'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {day.weekdayName}
                      </span>
                    </div>

                    {/* Status Badges */}
                    <div className="space-y-1 mt-1">
                      {isSun && (
                        <span className="block px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 truncate">
                          Sunday Off
                        </span>
                      )}

                      {isHostelLeave && (
                        <span className="block px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 truncate">
                          🏡 {day.holidayTitle}
                        </span>
                      )}

                      {isHoliday && (
                        <span className="block px-2 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200 truncate">
                          🌴 {day.holidayTitle}
                        </span>
                      )}

                      {!day.isHoliday && (
                        <span className="block px-2 py-0.5 rounded text-[9px] font-semibold text-slate-500 bg-slate-100 truncate">
                          {day.sessionsCount > 0 ? `${day.sessionsCount} Sessions` : 'Working Day'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Declared Holidays List Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Declared Leave & Holiday Register</h3>
            <span className="text-xs font-semibold text-slate-500">
              Total {holidays.length} leave entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Title / Leave Reason</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Start Date</th>
                  <th className="px-6 py-3.5">End Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {holidays.length > 0 ? (
                  holidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                        {h.type === 'HOSTEL_LEAVE' ? (
                          <Home className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Palmtree className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>{h.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            h.type === 'HOSTEL_LEAVE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {h.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{h.startDate}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{h.endDate}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No special hostel leaves declared for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Declare Leave / Holiday Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Declare Hostel Leave / Holiday">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Leave Title / Reason
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hostel Monthly Leave, Eid Al-Fitr, College Day"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
            >
              <option value="HOSTEL_LEAVE">Hostel Monthly Leave</option>
              <option value="HOLIDAY">Institutional Holiday</option>
              <option value="SPECIAL">Special Off Day</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-800 border border-brand-200">
            Declaring leave automatically adjusts the month's net working days for student report accuracy.
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md">
              Declare Leave
            </button>
          </div>
        </form>
      </Modal>

      {/* Selected Day Quick Action Modal */}
      {selectedDayDetail && (
        <Modal
          isOpen={Boolean(selectedDayDetail)}
          onClose={() => setSelectedDayDetail(null)}
          title={`Date Actions: ${selectedDayDetail.dateString}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">{selectedDayDetail.weekdayName}, {selectedDayDetail.dateString}</h4>
              <p className="text-xs text-slate-600 mt-1">
                Status: <strong className="text-brand-700">{selectedDayDetail.holidayTitle || 'Regular Working Day'}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  handleOpenModal(selectedDayDetail.dateString);
                  setSelectedDayDetail(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Home className="w-4 h-4" />
                <span>Declare Hostel Leave / Holiday for this Date</span>
              </button>

              <button
                onClick={() => {
                  navigate(`/mark-attendance`);
                  setSelectedDayDetail(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Mark Attendance for this Date</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
