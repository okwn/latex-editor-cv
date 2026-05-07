'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Globe, Mail, Phone, LinkIcon } from 'lucide-react';
import { loadSettings, saveSettings, type ProfileData } from '@/lib/settings/settingsStore';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'creative', label: 'Creative' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setProfile(settings.profile);
  }, []);

  const handleSave = useCallback(() => {
    if (!profile) return;
    const settings = loadSettings();
    saveSettings({ ...settings, profile });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <span className="font-semibold text-sm">Profile</span>
          {saved && (
            <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
              <CheckCircle size={11} /> Saved
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Basic info */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Basic Info</h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Your full name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Default Role / Title</label>
                <input
                  type="text"
                  value={profile.defaultRole}
                  onChange={(e) => setProfile({ ...profile, defaultRole: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Contact</h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <Mail size={11} /> Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <Phone size={11} /> Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <Globe size={11} /> Website
                </label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://yoursite.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </section>

          {/* Social */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Social</h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </label>
                <input
                  type="text"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  placeholder="username"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  placeholder="username"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </section>

          {/* Defaults */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">Defaults</h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Default Language</label>
                <select
                  value={profile.defaultLanguage}
                  onChange={(e) => setProfile({ ...profile, defaultLanguage: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Default CV Tone</label>
                <select
                  value={profile.defaultTone}
                  onChange={(e) => setProfile({ ...profile, defaultTone: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}