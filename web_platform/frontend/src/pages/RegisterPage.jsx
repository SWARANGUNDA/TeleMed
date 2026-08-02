import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Card, Input, Button, Alert } from '../components/ui';
import { Activity, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage({ onLogin, user }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (onLogin) {
        await onLogin(email, password, role);
      }
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col justify-between">
      <Navbar user={user} />

      <main className="pt-32 pb-20 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white flex items-center justify-center mx-auto shadow-lg">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Create TeleMed AI Account</h1>
            <p className="text-xs text-[var(--text-muted)]">Get started with explainable multimodal AI risk prediction</p>
          </div>

          <Card isGlass={true} className="p-8 space-y-6 shadow-2xl border-t-4 border-t-[var(--secondary)]">
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Register Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PATIENT', 'DOCTOR'].map((r) => (
                    <Button
                      key={r}
                      type="button"
                      variant={role === r ? 'primary' : 'outline'}
                      size="sm"
                      className="!py-1.5 text-xs font-semibold"
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <Input
                label="Full Name"
                placeholder="Dr. Sarah Jenkins"
                leftIcon={<User className="w-4 h-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="sarah@hospital.org"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account & Start Analysis →
              </Button>
            </form>

            <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[var(--primary)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
