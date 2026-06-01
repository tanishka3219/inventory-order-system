import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Loader2, Mail, Lock, ShieldAlert, Layers } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const from = location.state?.from?.pathname || '/';

  // Check if session expired redirect was triggered
  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.cleanMessage || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto w-full max-w-md text-center space-y-4">
        {/* Brand Logo */}
        <div className="inline-flex p-3 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-650/20">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-805 dark:text-white">
          Sign in to StockVibe
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Enterprise Inventory & Order Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl space-y-6">
          
          {/* System notification info banner */}
          {isExpired && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-semibold flex gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="pl-10 form-input"
                  placeholder="admin@inventory.com"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  className="pl-10 form-input"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick info about credentials */}
          <div className="p-4 bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-xl space-y-1.5 text-center">
            <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wide uppercase">
              Demonstration Credentials
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-450 font-medium">
              <p>Email: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">admin@inventory.com</span></p>
              <p>Password: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">admin123</span></p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium text-slate-400">
              Need a staff account?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
