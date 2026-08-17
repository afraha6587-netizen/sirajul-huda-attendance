import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, FileText, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { Navbar } from '../components/Navbar';

export const ImportExport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      alert('Excel batch import completed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import Excel file. Please ensure columns match template.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    // Generate simple sample CSV template for download
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'RegisterNumber,RollNumber,StudentName,ClassName,AdmissionNo,Phone,ParentPhone\n' +
      '201,1,MOHAMMED RAYAN,D-3,ADM202601,9876543210,9876543211\n' +
      '202,2,FATHIMA ZAHRA,D-3,ADM202602,9876543212,9876543213\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Sirajul_Huda_Student_Batch_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Batch Import / Export Roster" subtitle="Bulk upload students, teachers, and export Excel reports" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Batch Excel Importer */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center font-bold text-xl">
                📥
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Batch Student Roster Import</h3>
                <p className="text-xs text-slate-500 font-semibold">Upload Excel (.xlsx, .xls, .csv) with student roster</p>
              </div>
            </div>

            <button
              onClick={handleDownloadSample}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-brand-600" />
              <span>Download Excel Sample Template (.csv)</span>
            </button>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-brand-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">Drag & drop your Excel file here or browse</p>
                <p className="text-[11px] text-slate-400 mt-1">Columns: RegisterNumber, RollNumber, StudentName, ClassName, ParentPhone</p>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Imported {result.count || 'all'} student records successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || importing}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Processing Import...' : 'Execute Batch Upload'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Export Monthly Reports */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xl">
                📊
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Export Digital Excel Reports</h3>
                <p className="text-xs text-slate-500 font-semibold">Download class-wise monthly attendance Excel sheets</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-800">Export Class Monthly Sheet</p>
              <p className="text-xs text-slate-500">
                Generates a complete multi-subject Excel matrix including available classes, taken classes, subject percentages, and day-wise leave counts.
              </p>
              <a
                href="/monthly-report"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Go to Monthly Report & Export Excel</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
