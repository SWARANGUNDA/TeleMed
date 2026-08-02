import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Globe, Code, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] pt-16 pb-12 text-sm text-[var(--text-muted)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Version */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-[var(--text-main)] tracking-tight">TeleMed AI</span>
            </Link>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Clinical-grade multimodal disease risk prediction and explainable AI decision support platform.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono font-semibold text-[var(--primary)]">
              <ShieldCheck className="w-3.5 h-3.5" /> TeleMed AI v4.0 Stable
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-main)] tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/features" className="hover:text-[var(--primary)] transition-colors">Multimodal Intake</Link></li>
              <li><Link to="/research" className="hover:text-[var(--primary)] transition-colors">TreeSHAP Explainability</Link></li>
              <li><Link to="/research" className="hover:text-[var(--primary)] transition-colors">Medical RAG Engine</Link></li>
              <li><Link to="/about" className="hover:text-[var(--primary)] transition-colors">Physician Workspace</Link></li>
            </ul>
          </div>

          {/* Col 3: Research & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-main)] tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/research" className="hover:text-[var(--primary)] transition-colors">Scientific Architecture</Link></li>
              <li><Link to="/about" className="hover:text-[var(--primary)] transition-colors">HIPAA & Privacy</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--primary)] transition-colors">Support & Contact</Link></li>
            </ul>
          </div>

          {/* Col 4: Legal & Social */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-main)] tracking-wider">Legal & Social</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/privacy" className="hover:text-[var(--primary)] transition-colors">Terms of Service</Link></li>
            </ul>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://github.com/SWARANGUNDA/TeleMed" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-main)] hover:text-[var(--primary)] transition-colors" title="GitHub Repository">
                <Code className="w-4 h-4" />
              </a>
              <a href="https://telemed.ai" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-main)] hover:text-[var(--primary)] transition-colors" title="Official Website">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} TeleMed AI Platform. All rights reserved. Built for clinical decision support.
        </div>
      </div>
    </footer>
  );
}
