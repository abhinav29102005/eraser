'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
    title: 'Diagrams & Shapes',
    description: 'Drag-and-drop shapes, arrows, and connectors to build any diagram.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: 'Real-time Collaboration',
    description: 'Work together with your team — see cursors, edits, and changes live.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: 'AI-Powered',
    description: 'Generate diagrams from text descriptions and get smart layout suggestions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    title: 'Documentation',
    description: 'Attach rich-text notes and documentation directly to your canvases.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
      </svg>
    ),
    title: 'Cloud Synced',
    description: 'Your canvases are automatically saved and synced across all devices.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'Completely Free',
    description: 'No credit card, no limits, no hidden pricing — forever.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 text-surface-200">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-surface-900/80 backdrop-blur-lg border-b border-surface-700/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LUMO</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userId');
                    setIsLoggedIn(false);
                  }}
                  className="btn-ghost text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-700/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            Open source &amp; free forever
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">
            Diagrams &amp; docs
            <br />
            <span className="text-brand-400">for teams that ship</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
            The collaborative canvas for system architecture, flowcharts, and documentation.
            Real-time editing, AI assistance, and zero setup.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-primary text-base px-8 py-3">
                  Start for free →
                </Link>
                <Link href="/login" className="btn-secondary text-base px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Canvas preview mock */}
          <div className="mt-16 mx-auto max-w-3xl">
            <div className="card overflow-hidden shadow-float">
              <div className="bg-surface-800 border-b border-surface-700 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-surface-500 ml-2">system-architecture.canvas</span>
              </div>
              <div className="bg-surface-900 p-8 flex items-center justify-center h-64">
                <div className="flex items-center gap-4">
                  {['User', 'Client', 'Server', 'Database'].map((label, i) => (
                    <div key={label} className="flex items-center gap-4">
                      <div className="bg-surface-700 border border-surface-600 rounded-lg px-4 py-2 text-sm text-surface-300">{label}</div>
                      {i < 3 && (
                        <svg className="w-6 h-4 text-brand-500" fill="none" viewBox="0 0 24 16" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h18m0 0-4-4m4 4-4 4" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need</h2>
            <p className="mt-3 text-surface-400 text-lg">Built for engineers and teams who value speed and clarity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="card-hover group p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-surface-900/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Get started in 30 seconds</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Create a canvas', desc: 'Start a new whiteboard or diagram with one click.' },
              { num: '02', title: 'Invite your team', desc: 'Share a link and collaborate in real-time.' },
              { num: '03', title: 'Ship faster', desc: 'Document architecture, plan features, and align.' },
            ].map((step, idx) => (
              <div key={idx} className="text-center md:text-left">
                <div className="text-3xl font-extrabold text-brand-500/30 mb-3">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to build?</h2>
          <p className="text-surface-400 text-lg mb-8">
            Start diagramming and documenting — no credit card needed.
          </p>
          {!isLoggedIn && (
            <Link href="/register" className="btn-primary text-base px-10 py-3">
              Get Started Free →
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-700/60 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </div>
            <span className="text-sm text-surface-500">© 2026 LUMO. Free &amp; open source.</span>
          </div>
          <div className="flex gap-6 text-sm text-surface-500">
            <a href="#" className="hover:text-surface-300 transition-colors">GitHub</a>
            <a href="#" className="hover:text-surface-300 transition-colors">Docs</a>
            <a href="#" className="hover:text-surface-300 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
