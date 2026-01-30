import { ArrowLeft, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const StepPill = ({ active, done, children }) => {
  const base = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border';
  if (done) return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-100`}>{children}</span>;
  if (active) return <span className={`${base} bg-primary-50 text-primary-700 border-primary-100`}>{children}</span>;
  return <span className={`${base} bg-slate-50 text-slate-500 border-slate-100`}>{children}</span>;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: normalizedEmail });
      setStep(2);
      setSuccess('OTP sent. Please check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: normalizedEmail, otp: otp.trim() });
      setStep(3);
      setSuccess('OTP verified. You can now set a new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: normalizedEmail,
        otp: otp.trim(),
        newPassword,
      });
      setSuccess('Password reset successful. Redirecting to login…');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      <div className="w-full flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                <p className="text-slate-500 mt-1">Use OTP verification to securely reset your password.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <StepPill active={step === 1} done={step > 1}>Email</StepPill>
              <StepPill active={step === 2} done={step > 2}>OTP</StepPill>
              <StepPill active={step === 3} done={false}>New Password</StepPill>
            </div>

            {error ? (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium mb-4">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm font-medium mb-4">
                {success}
              </div>
            ) : null}

            {step === 1 ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send OTP'}
                </button>
              </form>
            ) : null}

            {step === 2 ? (
              <form onSubmit={verifyOtp} className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium">
                  OTP sent to <span className="font-bold text-slate-800">{normalizedEmail}</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">One-Time Password</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                    className="flex-1 py-4 rounded-xl font-bold text-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify OTP'}
                  </button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <form onSubmit={resetPassword} className="space-y-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium">
                  Verified for <span className="font-bold text-slate-800">{normalizedEmail}</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


