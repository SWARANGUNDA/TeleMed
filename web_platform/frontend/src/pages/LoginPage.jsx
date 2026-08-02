import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Card, Input, Button, Alert, Badge } from '../components/ui';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage({ onLogin, user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (onLogin) {
        await onLogin(email, password, role);
      }
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
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
            <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Sign In to TeleMed AI</h1>
            <p className="text-xs text-[var(--text-muted)]">Access your multimodal patient records & AI risk predictions</p>
          </div>

          <Card isGlass={true} className="p-8 space-y-6 shadow-2xl border-t-4 border-t-[var(--primary)]">
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Select Portal Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
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
                label="Email Address"
                type="email"
                placeholder="name@telemed.ai"
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
                Sign In to {role} Portal →
              </Button>
            </form>

            <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] space-y-2">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[var(--primary)] hover:underline">
                  Create an account
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
