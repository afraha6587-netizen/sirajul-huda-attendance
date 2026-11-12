import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Upload, Download, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import api from '../utils/api';
import { Subject, Class, Teacher } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    arabicName: '',
    code: '',
    classId: '',
    teacherId: '',
  });

  // Batch Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState('');

  const fetchSubjects = async (classFilter?: string) => {
    try {
      const activeFilter = classFilter !== undefined ? classFilter : selectedClassFilter;
      const params: any = {};
      if (activeFilter && activeFilter !== 'all') {
        params.classId = activeFilter;
      }

      const [subRes, clsRes, tchRes] = await Promise.all([
        api.get('/subjects', { params }),
        classes.length === 0 ? api.get('/classes') : Promise.resolve({ data: classes }),
        teachers.length === 0 ? api.get('/teachers') : Promise.resolve({ data: teachers }),
      ]);

      setSubjects(subRes.data || []);
      if (classes.length === 0) setClasses(clsRes.data || []);
      if (teachers.length === 0) setTeachers(tchRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedClassFilter]);

  const handleOpenModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setFormData({
        name: sub.name,
        arabicName: sub.arabicName || sub.name,
        code: sub.code,
        classId: '',
        teacherId: '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        arabicName: '',
        code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
        classId: selectedClassFilter !== 'all' && selectedClassFilter !== 'unassigned' ? selectedClassFilter : '',
        teacherId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, {
          name: formData.name,
          arabicName: formData.arabicName,
          code: formData.code,
        });
      } else {
        await api.post('/subjects', formData);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save subject');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this subject? Deleting it will also remove all its class assignments.'
      )
    ) {
      return;
    }
    try {
      await api.delete(`/subjects/${id}`);
      fetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete subject');
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
      setImportError('');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);
    setImportError('');

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/import/subjects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      fetchSubjects();
    } catch (err: any) {
      setImportError(err.response?.data?.error || 'Failed to import subjects Excel file.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSubjectSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'SubjectCode,SubjectName,ArabicName,ClassName,TeacherName\n' +
      'SUB-TAFSIR,Tafseer Al-Jalalain,تفسير الجلالين,D-3,Usthad Ahmad\n' +
      'SUB-FIQH,Fath Al-Muin,فتح المعين,D-3,Usthad Hassan\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Sirajul_Huda_Subjects_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar
        title="Subject Master Catalog"
        subtitle="Manage academic subjects, Arabic titles, and class-specific curriculum assignments"
      />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Subjects Directory ({subjects.length})
            </h2>
            <p className="text-xs text-slate-500">
              Each class has its own assigned subjects. Subjects entered for one class are isolated to that class.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setImportFile(null);
                setImportResult(null);
                setImportError('');
                setIsImportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Subjects (Excel)</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>
        </div>

        {/* Filter by Class Pills */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Filter by Class:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClassFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Classes
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassFilter(cls.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedClassFilter === cls.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Class {cls.name}
              </button>
            ))}
            <button
              onClick={() => setSelectedClassFilter('unassigned')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClassFilter === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Unassigned Only
            </button>
          </div>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading subjects...</div>
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => {
              const assignedCount = sub.classSubjects?.length || sub._count?.classSubjects || 0;

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shadow-xs">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{sub.name}</h3>
                          <p className="text-sm font-arabic font-bold text-brand-700 mt-0.5">
                            {sub.arabicName}
                          </p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 inline-block">
                            Code: {sub.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Assigned Classes Pill List */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Assigned To ({assignedCount} Classes):
                      </div>
                      {sub.classSubjects && sub.classSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {sub.classSubjects.map((cs) => (
                            <span
                              key={cs.id}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                            >
                              Class {cs.class?.name || 'Class'}
                              {cs.teacher && (
                                <span className="text-emerald-600 font-semibold ml-1">
                                  ({cs.teacher.name})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-block">
                          Not assigned to any class yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No subjects found</h3>
            <p className="text-xs text-slate-500">
              {selectedClassFilter !== 'all'
                ? 'No subjects are assigned to this class filter yet.'
                : 'No subjects have been created in the catalog yet.'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Create New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Name (English)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alfiya / Tafseer Al-Jalalain / Fath Al Muin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Arabic Subject Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ألفية ابن مالك / تفسير الجلالين"
              value={formData.arabicName}
              onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-arabic focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Subject Code (Unique)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SUB-ALFIYA"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:border-brand-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* If creating a new subject, provide optional direct class + teacher assignment */}
          {!editingSubject && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[11px] font-black text-brand-700 uppercase tracking-wider block">
                Assign to Specific Class (Optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">-- None (Catalog only) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.classId && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Assign Usthad
                    </label>
                    <select
                      required={Boolean(formData.classId)}
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-brand-600 focus:outline-none"
                    >
                      <option value="">-- Select Usthad --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                If assigned to a class, this subject will strictly belong to that class only.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
            >
              {editingSubject ? 'Update Subject' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Import Subjects Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Import Subjects from Excel"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload an Excel (.xlsx, .xls) or CSV file containing subject master records.
          </p>

          <button
            type="button"
            onClick={handleDownloadSubjectSample}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Download Subjects Sample Template (.csv)</span>
          </button>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/50">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-700">Select Subject Excel or CSV file</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Headers: SubjectName, ArabicName, SubjectCode, ClassName, TeacherName
            </p>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportFileChange}
              className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
            />
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Successfully imported {importResult.successCount || importResult.count || 0} subjects!
              </span>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!importFile || importing}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{importing ? 'Importing...' : 'Upload & Import'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};