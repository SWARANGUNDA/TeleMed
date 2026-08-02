import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Menu, X, Shield, ArrowRight, UserCheck, Lock } from 'lucide-react';
import { Button } from '../ui';

export default function Navbar({ user, onOpenAuth }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Technology', path: '/research' },
    { name: 'Research', path: '/research' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-[var(--text-main)] tracking-tight block">TeleMed AI</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase block -mt-1">v4.0 STABLE</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? 'text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Shield className="w-4 h-4" />}
              onClick={() => navigate('/dashboard')}
            >
              Enter Dashboard →
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth ? onOpenAuth('login') : navigate('/login')}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => onOpenAuth ? onOpenAuth('register') : navigate('/register')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="md:hidden p-2 rounded-xl text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-4 pt-4 pb-6 space-y-4 shadow-xl animate-fade-in">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-[var(--text-main)] py-2 border-b border-[var(--border-subtle)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            {user ? (
              <Button variant="primary" size="md" className="w-full" onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}>
                Enter Dashboard →
              </Button>
            ) : (
              <>
                <Button variant="outline" size="md" className="w-full" onClick={() => { setIsMobileMenuOpen(false); onOpenAuth ? onOpenAuth('login') : navigate('/login'); }}>
                  Log In
                </Button>
                <Button variant="primary" size="md" className="w-full" onClick={() => { setIsMobileMenuOpen(false); onOpenAuth ? onOpenAuth('register') : navigate('/register'); }}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
