import React, { useEffect, useState, useRef } from 'react';
import { Database, Download, HardDrive, Table, RefreshCw, ShieldCheck, CheckCircle2, Search, Upload, Archive, FileText } from 'lucide-react';
import JSZip from 'jszip';
import api from '../utils/api';
import { Navbar } from '../components/Navbar';

export const DatabaseViewerPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('students');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.get('/database/overview');
      setOverview(res.data);
    } catch (err) {
      console.error('Failed to fetch database overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchTableData = async (tbl: string) => {
    setLoadingTable(true);
    try {
      const res = await api.get(`/database/table/${tbl}`);
      setTableData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(`Failed to fetch ${tbl} table:`, err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  const downloadBlobAsFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
  };

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/database/backup');
      const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlobAsFile(blob, `Sirajul_Huda_Database_Backup_${dateStr}.json`);
    } catch (err: any) {
      console.error('Failed to download database backup:', err);
      alert('Failed to download database backup.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadZipBackup = async () => {
    setDownloadingZip(true);
    try {
      console.log('Fetching database backup for ZIP generation...');
      const res = await api.get('/database/backup');
      const backupData = res.data;
      const db = backupData?.database || backupData || {};

      console.log('Building ZIP archive with JSZip...');
      const zip = new JSZip();

      // 1. Unified Full Backup JSON
      zip.file('full_database_backup.json', JSON.stringify(backupData, null, 2));

      // 2. Metadata JSON
      const metadata = {
        institution: backupData.institution || 'Sirajul Huda College of Science and Integrated Studies, Nadapuram',
        exportTimestamp: backupData.exportTimestamp || new Date().toISOString(),
        version: backupData.version || '2.0',
        securityLevel: 'Z+ Multi-Layer Secure Backup (ZIP Archive)',
        counts: {
          students: db.students?.length || 0,
          classes: db.classes?.length || 0,
          subjects: db.subjects?.length || 0,
          teachers: db.teachers?.length || 0,
          classSubjects: db.classSubjects?.length || 0,
          attendanceSessions: db.attendanceSessions?.length || 0,
          dailyAttendance: db.dailyAttendance?.length || 0,
          studentRemarks: db.studentRemarks?.length || 0,
          teacherAttendances: db.teacherAttendances?.length || 0,
          holidays: db.holidays?.length || 0,
        },
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // 3. Individual Table Files inside ZIP for maximum safety
      if (Array.isArray(db.students)) zip.file('students.json', JSON.stringify(db.students, null, 2));
      if (Array.isArray(db.attendanceSessions)) zip.file('attendance_sessions.json', JSON.stringify(db.attendanceSessions, null, 2));
      if (Array.isArray(db.dailyAttendance)) zip.file('daily_attendance.json', JSON.stringify(db.dailyAttendance, null, 2));
      if (Array.isArray(db.teachers)) zip.file('teachers.json', JSON.stringify(db.teachers, null, 2));
      if (Array.isArray(db.classes)) zip.file('classes.json', JSON.stringify(db.classes, null, 2));
      if (Array.isArray(db.subjects)) zip.file('subjects.json', JSON.stringify(db.subjects, null, 2));
      if (Array.isArray(db.classSubjects)) zip.file('class_subjects.json', JSON.stringify(db.classSubjects, null, 2));
      if (Array.isArray(db.studentRemarks)) zip.file('student_remarks.json', JSON.stringify(db.studentRemarks, null, 2));
      if (Array.isArray(db.teacherAttendances)) zip.file('teacher_attendances.json', JSON.stringify(db.teacherAttendances, null, 2));
      if (Array.isArray(db.academicYears)) zip.file('academic_years.json', JSON.stringify(db.academicYears, null, 2));
      if (Array.isArray(db.academicMonths)) zip.file('academic_months.json', JSON.stringify(db.academicMonths, null, 2));
      if (Array.isArray(db.holidays)) zip.file('holidays.json', JSON.stringify(db.holidays, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlobAsFile(zipBlob, `Sirajul_Huda_ZPlus_Database_Backup_${dateStr}.zip`);
    } catch (err: any) {
      console.error('Failed to download ZIP backup:', err);
      alert(err.message || 'Failed to download ZIP database backup.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure you want to restore this database backup? Existing records will be safely upserted without data loss.")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/database/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message || 'Database backup restored successfully!');
      fetchOverview();
      fetchTableData(selectedTable);
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      alert(err.response?.data?.error || 'Failed to restore database backup.');
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredData = tableData.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tableList = [
    { key: 'students', label: 'Students Roster', count: overview?.counts?.students || 0 },
    { key: 'sessions', label: 'Attendance Sessions', count: overview?.counts?.attendanceSessions || 0 },
    { key: 'daily-attendance', label: 'Daily Attendance', count: overview?.counts?.dailyAttendance || 0 },
    { key: 'classes', label: 'College Classes', count: overview?.counts?.classes || 0 },
    { key: 'subjects', label: 'Academic Subjects', count: overview?.counts?.subjects || 0 },
    { key: 'teachers', label: 'Usthads / Teachers', count: overview?.counts?.teachers || 0 },
    { key: 'users', label: 'User Accounts', count: overview?.counts?.users || 0 },
    { key: 'holidays', label: 'Calendar Holidays', count: overview?.counts?.holidays || 0 },
  ];

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Database Inspector & Live Backup" subtitle="View raw database tables, verify cloud persistence, and download full system backups" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Status Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{overview?.databaseType || 'Database Connected & Active'}</span>
              </div>
              <h2 className="text-xl font-extrabold mt-1">Live Database Inspector</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                All attendance logs, student rosters, classes, and settings are stored in real-time. Download full JSON or ZIP backups at any time with Z+ Security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            <button
              onClick={fetchOverview}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDownloadZipBackup}
              disabled={downloadingZip}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Archive className="w-4 h-4 text-emerald-200" />
              <span>{downloadingZip ? 'Zipping Data...' : 'Download Z+ ZIP Backup (.zip)'}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{downloading ? 'Preparing...' : 'JSON Backup (.json)'}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreBackup}
              accept=".json,.zip"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{restoring ? 'Restoring Backup...' : 'Restore Backup (.json / .zip)'}</span>
            </button>
          </div>
        </div>

        {/* Z+ Security Protection Info Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-5 text-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Z+ Security Double Backup Protection Active</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/40">Z+ Safe</span>
              </h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Download as a multi-file <strong>ZIP Archive</strong> (includes separate JSON files for students, sessions, remarks, teachers, etc.) or as a single <strong>JSON backup</strong>. Restore either format anytime with 0 data loss.
              </p>
            </div>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tableList.map((tbl) => (
            <button
              key={tbl.key}
              onClick={() => setSelectedTable(tbl.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all border ${
                selectedTable === tbl.key
                  ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{tbl.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  selectedTable === tbl.key ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tbl.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table Inspector Controls & Data Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">
              Inspecting Table: <span className="text-brand-600 uppercase">{selectedTable}</span> ({filteredData.length} records)
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingTable ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading live database table rows...</div>
            ) : filteredData.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    {Object.keys(filteredData[0]).slice(0, 7).map((col) => (
                      <th key={col} className="px-6 py-3.5">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredData.slice(0, 50).map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.keys(filteredData[0]).slice(0, 7).map((col) => {
                        const val = row[col];
                        let renderedVal = '';
                        if (typeof val === 'object' && val !== null) {
                          renderedVal = val.name || val.title || val.email || JSON.stringify(val);
                        } else {
                          renderedVal = String(val ?? '—');
                        }

                        return (
                          <td key={col} className="px-6 py-3.5 max-w-xs truncate font-mono text-[11px]">
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">No records found in this table</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
