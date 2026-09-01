import React, { useEffect, useState } from 'react';
import { Database, Download, HardDrive, Table, RefreshCw, ShieldCheck, CheckCircle2, Search } from 'lucide-react';
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

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/database/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sirajul_Huda_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download database backup.');
    } finally {
      setDownloading(false);
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
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
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
                All attendance logs, student rosters, classes, and settings are stored in real-time. Download full JSON backups at any time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchOverview}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Backup...' : 'Download Full Backup (.json)'}</span>
            </button>
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
