import React, { useEffect, useState } from 'react';
import { BookOpen, UserCheck, Calendar, Filter, Sparkles, FileText } from 'lucide-react';
import api from '../utils/api';
import { Class, Subject } from '../types';
import { Navbar } from '../components/Navbar';
import { getHijriDateString } from '../utils/hijri';

export const SyllabusLogPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [syllabusLogs, setSyllabusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/classes'), api.get('/subjects')]).then(([cRes, sRes]) => {
      setClasses(cRes.data);
      setSubjects(sRes.data);
    });
  }, []);

  const fetchSyllabusLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/syllabus-log', {
        params: {
          classId: selectedClassId,
          subjectId: selectedSubjectId,
        },
      });
      setSyllabusLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabusLogs();
  }, [selectedClassId, selectedSubjectId]);

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="Usthad Syllabus & Kitab Progress Log" subtitle="Track taught topics, lessons, and kitab pages across class periods" />

      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-700">Filter Progress:</span>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-600 focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.arabicName})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            Total Sessions Logged: {syllabusLogs.length}
          </span>
        </div>

        {/* Syllabus Progress Timeline Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              <span>Syllabus Coverage Timeline</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Loading syllabus logs...
            </div>
          ) : syllabusLogs.length > 0 ? (
            <div className="space-y-4">
              {syllabusLogs.map((log) => (
                <div
                  key={log.sessionId}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 hover:border-brand-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-brand-600 text-white uppercase">
                        Period {log.period}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-800 uppercase">
                        Class {log.className}
                      </span>
                      <span className="text-xs font-bold text-brand-700">
                        {log.subjectName} ({log.arabicName})
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      📖 {log.topicTaught}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 pt-1">
                      <span>Usthad: <strong className="text-slate-800">{log.teacherName}</strong></span>
                      <span>•</span>
                      <span>Kitab Page / Ref: <strong className="text-teal-700">{log.kitabPage}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      <span>{log.date}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-teal-700 mt-0.5">
                      🌙 {getHijriDateString(log.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No syllabus topics logged for the selected filter
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
