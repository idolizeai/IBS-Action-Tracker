import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import idolizeLogo from '../assets/logo.png';
import niyojanlogo from '../assets/niyojan.png';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot-password', 'verify-otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [otpForm, setOtpForm] = useState({ email: '', otp: '', newPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setForgot = (k, v) => setForgotForm(f => ({ ...f, [k]: v }));
  const setOtp = (k, v) => setOtpForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else if (mode === 'register') {
        await register(form.name, form.email, form.password);
      } else if (mode === 'forgot-password') {
        await axiosInstance.post('/auth/forget-password', { email: forgotForm.email });
        setOtpForm({ email: forgotForm.email, otp: '', newPassword: '' });
        setMode('verify-otp');
        toast.success('OTP sent to your email!');
      } else if (mode === 'verify-otp') {
        await axiosInstance.post('/auth/validate-otp', {
          email: otpForm.email,
          otp: otpForm.otp,
          newPassword: otpForm.newPassword,
        });
        toast.success('Password reset successfully!');
        setMode('login');
        setForm({ name: '', email: '', password: '' });
        setForgotForm({ email: '' });
        setOtpForm({ email: '', otp: '', newPassword: '' });
      }
      if (mode === 'login' || mode === 'register') {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const goBack = () => {
    setMode('login');
    setForm({ name: '', email: '', password: '' });
    setForgotForm({ email: '' });
    setOtpForm({ email: '', otp: '', newPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Subtle background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>


      <div className='fixed left-2 top-4'>
        <img src={idolizeLogo} alt="Idolize" className="mx-auto  h-5 w-auto md:h-14" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25 mb-4">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div> */}


          <div className="">
            <img src={niyojanlogo} alt="Idolize" className="mx-auto  h-16 w-auto md:h-full md:w-auto mb-4" />
          </div>

          <h1 className="md:text-4xl text-2xl font-bold text-slate-900">IBS Niyojan</h1>
          <p className="text-slate-500 text-sm mt-1">Your priorities, organised.</p>
        </div>

        {/* Tab toggle */}
        <AnimatePresence mode="wait">
          {(mode === 'login' || mode === 'register') && (
            <motion.div
              key="auth-tabs"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-200 p-1 flex mb-5 rounded-xl"
            >
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </motion.div>
          )}

          {(mode === 'forgot-password' || mode === 'verify-otp') && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              type="button"
              onClick={goBack}
              className="mb-5 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </motion.button>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <AnimatePresence mode="wait">
            {/* Login/Register Form */}
            {(mode === 'login' || mode === 'register') && (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required={mode === 'register'}
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-field pr-11"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        setForm({ name: '', email: '', password: '' });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </motion.div>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot-password' && (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Reset Password</h2>
                  <p className="text-sm text-slate-600 mb-4">Enter your email address and we'll send you an OTP to reset your password.</p>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@company.com"
                    value={forgotForm.email}
                    onChange={e => setForgot('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : <LogIn size={16} />}
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </motion.div>
            )}

            {/* Verify OTP Form */}
            {mode === 'verify-otp' && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Verify OTP</h2>
                  <p className="text-sm text-slate-600 mb-4">Enter the OTP sent to <span className="font-semibold">{otpForm.email}</span></p>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                    OTP
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="000000"
                    value={otpForm.otp}
                    onChange={e => setOtp('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="input-field pr-11"
                      placeholder="••••••••"
                      value={otpForm.newPassword}
                      onChange={e => setOtp('newPassword', e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : <LogIn size={16} />}
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}