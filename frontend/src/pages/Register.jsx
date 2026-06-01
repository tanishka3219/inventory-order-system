import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, User, UserCheck, ShieldAlert, Layers } from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      role: 'staff'
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await registerUser(data.email, data.password, data.fullName, data.role);
      setSuccessMsg('Account registered successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.cleanMessage || 'Registration failed. Email might already be registered.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto w-full max-w-md text-center space-y-4">
        {/* Brand Logo */}
        <div className="inline-flex p-3 bg-primary-600 rounded-2xl text-white shadow-xl">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-805 dark:text-white">
          Create an Account
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Register a staff profile to access StockVibe
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl space-y-6">
          
          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold flex gap-2">
              <UserCheck size={16} className="shrink-0" />
              <span>{successMsg}</span>
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
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  className="pl-10 form-input"
                  placeholder="John Doe"
                  {...register('fullName', { required: 'Full name is required' })}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500 font-semibold">{errors.fullName.message}</p>
              )}
            </div>

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
                  placeholder="staff@inventory.com"
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

            {/* Role selection for demonstration ease */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                System Role
              </label>
              <select
                className="mt-1.5 form-input py-2"
                {...register('role', { required: 'Role is required' })}
              >
                <option value="staff">Staff (Read-Only Products & Place Orders)</option>
                <option value="manager">Manager (Read/Write Products & Customers)</option>
                <option value="admin">Administrator (Full Access & View Audit Trails)</option>
              </select>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs font-medium text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
