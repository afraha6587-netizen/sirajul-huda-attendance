import React, { useEffect, useState } from 'react';
import { Save, Settings2, Sliders } from 'lucide-react';
import api from '../utils/api';
import { SystemSettings } from '../types';
import { Navbar } from '../components/Navbar';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    id: '1',
    collegeName: 'Islamic Academic College',
    logoUrl: '',
    attendanceThreshold: 75.0,
    timezone: 'Asia/Kolkata',
    dateFormat: 'YYYY-MM-DD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data);
      alert('Settings saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading settings...</div>;
  }

  return (
    <div className="flex-1 bg-surface-bg min-h-screen pb-12">
      <Navbar title="System Settings" subtitle="Configure global attendance thresholds and college metadata" />

      <main className="max-w-4xl mx-auto px-6 pt-6 space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                College / Institution Name
              </label>
              <input
                type="text"
                required
                value={settings.collegeName}
                onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Attendance Warning Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={settings.attendanceThreshold}
                  onChange={(e) => setSettings({ ...settings, attendanceThreshold: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Students below this % will be visually highlighted and shown in At-Risk report
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:border-brand-600 focus:bg-white focus:outline-none"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
