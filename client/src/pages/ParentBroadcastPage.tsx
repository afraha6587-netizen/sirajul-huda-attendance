import React, { useEffect, useState } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Home,
  Palmtree,
  Building,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  Filter,
  AlertCircle,
  Bus,
} from 'lucide-react';
import api from '../utils/api';
import { Class } from '../types';
import { Navbar } from '../components/Navbar';

interface BroadcastMessage {
  studentId: string;
  studentName: string;
  registerNumber: string;
  rollNumber: number;
  className: string;
  parentPhone: string;
  cleanPhone: string;
  hasPhone: boolean;
  messageText: string;
  whatsappUrl: string | null;
}

export const ParentBroadcastPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Template Type & Custom Fields
  const [activeTemplate, setActiveTemplate] = useState<string>('HOSTEL_LEAVE_GOING');
  const [customTitle, setCustomTitle] = useState('Hostel Monthly Leave Notice');
  const [customParams, setCustomParams] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '04:00 PM',
    returnDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    returnTime: '05:00 PM',
    details: 'Annual Field Trip & Academic Outing',
  });

  const [messageTemplate, setMessageTemplate] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch Classes on Mount
  useEffect(() => {
    api.get('/classes').then((res) => {
      const clsList = Array.isArray(res.data) ? res.data : [];
      setClasses(clsList);
      if (clsList.length > 0) {
        setSelectedClassIds(clsList.map((c) => c.id));
      }
    });
  }, []);

  // Update Template Text when Preset or Custom Params Change
  useEffect(() => {
    let tpl = '';
    let title = '';

    if (activeTemplate === 'HOSTEL_LEAVE_GOING') {
      title = 'Hostel Monthly Leave - Going Home Notice';
      tpl = `Sirajul Huda College Alert: Dear Parent, Hostel Monthly Leave for student {student_name} (Class {class_name}, Reg: {register_number}) starts on {date}. Students are permitted to leave hostel after {time}.`;
    } else if (activeTemplate === 'HOSTEL_LEAVE_RETURN') {
      title = 'Hostel Monthly Leave - Return to Hostel Notice';
      tpl = `Sirajul Huda College Alert: Dear Parent, Hostel Monthly Leave ends on {returnDate}. Please ensure your ward {student_name} (Class {class_name}) returns safely to the hostel before {returnTime}.`;
    } else if (activeTemplate === 'FIELD_TRIP') {
      title = 'College Trip / Outing Announcement';
      tpl = `Sirajul Huda College Alert: Dear Parent, College Outing / Field Trip for student {student_name} (Class {class_name}) is scheduled on {date}. Program Details: {details}.`;
    } else if (activeTemplate === 'PARENT_MEETING') {
      title = 'Parent-Teacher Meeting Notice';
      tpl = `Sirajul Huda College Notice: Dear Parent, Parent-Teacher Meeting for Class {class_name} will be held on {date} at {time}. You are cordially invited to discuss student {student_name}'s academic progress.`;
    } else {
      title = 'General College Announcement';
      tpl = `Sirajul Huda College Notice: Dear Parent of {student_name} (Class {class_name}), {details}`;
    }

    setCustomTitle(title);
    setMessageTemplate(tpl);
  }, [activeTemplate]);

  // Toggle Single Class
  const handleToggleClass = (id: string) => {
    if (selectedClassIds.includes(id)) {
      setSelectedClassIds(selectedClassIds.filter((cId) => cId !== id));
      setSelectAll(false);
    } else {
      const updated = [...selectedClassIds, id];
      setSelectedClassIds(updated);
      if (updated.length === classes.length) setSelectAll(true);
    }
  };

  // Toggle All Classes
  const handleToggleAllClasses = () => {
    if (selectAll) {
      setSelectedClassIds([]);
      setSelectAll(false);
    } else {
      setSelectedClassIds(classes.map((c) => c.id));
      setSelectAll(true);
    }
  };

  // Generate Broadcast Messages
  const handleGenerateBroadcast = async () => {
    if (selectedClassIds.length === 0) {
      alert('Please select at least one class to send parent notifications!');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/broadcast/generate', {
        classIds: selectedClassIds,
        templateType: activeTemplate,
        title: customTitle,
        messageTemplate,
        customParams,
      });

      setBroadcastResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate parent broadcast');
    } finally {
      setGenerating(false);
    }
  };

  // Download Contact List CSV
  const handleDownloadCSV = () => {
    if (!broadcastResult?.messages) return;

    const headers = ['Register No', 'Roll No', 'Student Name', 'Class', 'Parent Phone', 'Message Text'];
    const rows = broadcastResult.messages.map((m: BroadcastMessage) => [
      m.registerNumber,
      m.rollNumber,
      `"${m.studentName}"`,
      `"${m.className}"`,
      m.parentPhone,
      `"${m.messageText.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Parent_Notification_List_${activeTemplate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Copy All Messages to Clipboard
  const handleCopyMessages = () => {
    if (!broadcastResult?.messages) return;

    const textToCopy = broadcastResult.messages
      .map((m: BroadcastMessage) => `[${m.className} - ${m.studentName} (${m.parentPhone})]:\n${m.messageText}`)
      .join('\n\n-----------------------------------\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar
        title="Parent Notification & Broadcast Center"
        subtitle="Send instant single-click WhatsApp announcements & leave notices to parents"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Send className="w-4 h-4" />
              <span>Multi-Class Parent Broadcast Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              One-Click Parent WhatsApp & Text Notification
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Select announcement preset (Hostel Leave Going/Return, Trip, PTM, Emergency), choose target classes, and dispatch messages directly to saved parent phone numbers.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/10 text-center shrink-0 min-w-44">
            <span className="text-[10px] text-brand-300 font-bold uppercase block">Classes Selected</span>
            <span className="text-2xl font-black text-white">{selectedClassIds.length} of {classes.length}</span>
          </div>
        </div>

        {/* Preset Notification Template Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            1. Select Notification Category / Template Preset
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Hostel Leave Going */}
            <button
              type="button"
              onClick={() => setActiveTemplate('HOSTEL_LEAVE_GOING')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                activeTemplate === 'HOSTEL_LEAVE_GOING'
                  ? 'bg-purple-900 text-white border-purple-700 shadow-md ring-2 ring-purple-500'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Home className={`w-5 h-5 ${activeTemplate === 'HOSTEL_LEAVE_GOING' ? 'text-purple-300' : 'text-purple-600'}`} />
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Going Home
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug">Hostel Leave (Departure)</h4>
                <p className="text-[10px] opacity-75 mt-0.5">Students going home notice</p>
              </div>
            </button>

            {/* 2. Hostel Leave Return */}
            <button
              type="button"
              onClick={() => setActiveTemplate('HOSTEL_LEAVE_RETURN')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                activeTemplate === 'HOSTEL_LEAVE_RETURN'
                  ? 'bg-indigo-900 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Building className={`w-5 h-5 ${activeTemplate === 'HOSTEL_LEAVE_RETURN' ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Return Hostel
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug">Hostel Leave (Return)</h4>
                <p className="text-[10px] opacity-75 mt-0.5">Return date & time notice</p>
              </div>
            </button>

            {/* 3. Field Trip / Outing */}
            <button
              type="button"
              onClick={() => setActiveTemplate('FIELD_TRIP')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                activeTemplate === 'FIELD_TRIP'
                  ? 'bg-teal-900 text-white border-teal-700 shadow-md ring-2 ring-teal-500'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Bus className={`w-5 h-5 ${activeTemplate === 'FIELD_TRIP' ? 'text-teal-300' : 'text-teal-600'}`} />
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Field Trip
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug">Tour & Field Trip</h4>
                <p className="text-[10px] opacity-75 mt-0.5">College outing announcement</p>
              </div>
            </button>

            {/* 4. Parent Meeting */}
            <button
              type="button"
              onClick={() => setActiveTemplate('PARENT_MEETING')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                activeTemplate === 'PARENT_MEETING'
                  ? 'bg-brand-900 text-white border-brand-700 shadow-md ring-2 ring-brand-500'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Users className={`w-5 h-5 ${activeTemplate === 'PARENT_MEETING' ? 'text-brand-300' : 'text-brand-600'}`} />
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  PTM Meeting
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug">Parent Teacher Meeting</h4>
                <p className="text-[10px] opacity-75 mt-0.5">Schedule meeting notice</p>
              </div>
            </button>

            {/* 5. Custom Announcement */}
            <button
              type="button"
              onClick={() => setActiveTemplate('CUSTOM')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                activeTemplate === 'CUSTOM'
                  ? 'bg-slate-900 text-white border-slate-700 shadow-md ring-2 ring-slate-500'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <MessageSquare className={`w-5 h-5 ${activeTemplate === 'CUSTOM' ? 'text-amber-400' : 'text-slate-700'}`} />
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  Custom Text
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-snug">Custom Message</h4>
                <p className="text-[10px] opacity-75 mt-0.5">Write any text message</p>
              </div>
            </button>
          </div>
        </div>

        {/* Controls Grid: Target Classes + Dynamic Message Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Target Classes Selection Box (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <span>2. Select Target Classes</span>
              </h3>

              <button
                type="button"
                onClick={handleToggleAllClasses}
                className="text-xs font-bold text-brand-700 hover:underline"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {classes.map((cls) => {
                const isChecked = selectedClassIds.includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-brand-50/60 border-brand-300 text-brand-950 font-bold'
                        : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClass(cls.id)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs font-extrabold">Class {cls.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {(cls as any).students?.length ? `${(cls as any).students.length} Students` : 'Active Class'}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
              💡 Notifications will be generated for all saved parent contacts in the selected {selectedClassIds.length} classes.
            </div>
          </div>

          {/* Dynamic Message Parameters & Template Text Editor (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>3. Fill Details & Message Template</span>
            </h3>

            {/* Dynamic Inputs depending on Template */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activeTemplate === 'HOSTEL_LEAVE_GOING' || activeTemplate === 'FIELD_TRIP' || activeTemplate === 'PARENT_MEETING') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start / Departure Date
                  </label>
                  <input
                    type="date"
                    value={customParams.date}
                    onChange={(e) => setCustomParams({ ...customParams, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}

              {(activeTemplate === 'HOSTEL_LEAVE_GOING' || activeTemplate === 'PARENT_MEETING') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Departure / Meeting Time
                  </label>
                  <input
                    type="text"
                    value={customParams.time}
                    onChange={(e) => setCustomParams({ ...customParams, time: e.target.value })}
                    placeholder="e.g. 04:00 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}

              {activeTemplate === 'HOSTEL_LEAVE_RETURN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Return to Hostel Date
                  </label>
                  <input
                    type="date"
                    value={customParams.returnDate}
                    onChange={(e) => setCustomParams({ ...customParams, returnDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}

              {activeTemplate === 'HOSTEL_LEAVE_RETURN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hostel Reporting Time
                  </label>
                  <input
                    type="text"
                    value={customParams.returnTime}
                    onChange={(e) => setCustomParams({ ...customParams, returnTime: e.target.value })}
                    placeholder="e.g. 05:00 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}

              {(activeTemplate === 'FIELD_TRIP' || activeTemplate === 'CUSTOM') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Details / Additional Notes
                  </label>
                  <input
                    type="text"
                    value={customParams.details}
                    onChange={(e) => setCustomParams({ ...customParams, details: e.target.value })}
                    placeholder="e.g. Field Trip to Wayanad, Reporting time 7:00 AM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-brand-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Template Message Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Editable Message Text Template
                </label>
                <span className="text-[10px] text-brand-600 font-bold">
                  Tags: &#123;student_name&#125;, &#123;class_name&#125;, &#123;register_number&#125;
                </span>
              </div>

              <textarea
                rows={4}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:border-brand-600 focus:bg-white focus:outline-none leading-relaxed"
              ></textarea>
            </div>

            {/* Generate CTA Button */}
            <button
              type="button"
              onClick={handleGenerateBroadcast}
              disabled={generating || selectedClassIds.length === 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {generating ? (
                <span className="animate-pulse">Generating WhatsApp Parent Links...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate WhatsApp Parent Broadcast List ({selectedClassIds.length} Classes)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Broadcast Output & Dispatcher List */}
        {broadcastResult && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-300">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{broadcastResult.title} ({broadcastResult.totalRecipients} Parents)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valid WhatsApp Phone Numbers: <strong className="text-emerald-700">{broadcastResult.validPhoneCount}</strong> / {broadcastResult.totalRecipients}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessages}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>{copied ? 'Copied!' : 'Copy All Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Phone List (.csv)</span>
                </button>
              </div>
            </div>

            {/* Recipient Rows Table */}
            <div className="overflow-x-auto touch-pan-x rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5 w-16">Reg No</th>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Class</th>
                    <th className="px-5 py-3.5">Parent Contact</th>
                    <th className="px-5 py-3.5">Personalized Message Preview</th>
                    <th className="px-5 py-3.5 text-right w-44">WhatsApp Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {broadcastResult.messages.map((m: BroadcastMessage, idx: number) => (
                    <tr key={m.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-brand-700">{m.registerNumber}</td>
                      <td className="px-5 py-3.5 font-black text-slate-900">{m.studentName}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          Class {m.className}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {m.hasPhone ? (
                          <span className="text-emerald-700">{m.parentPhone}</span>
                        ) : (
                          <span className="text-rose-500 text-[10px] font-bold italic">No contact saved</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 text-[11px] leading-relaxed max-w-md">
                        {m.messageText}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {m.whatsappUrl ? (
                          <a
                            href={m.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200">
                            Missing Phone
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
