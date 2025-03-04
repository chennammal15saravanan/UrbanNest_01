import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react';
import { signInWithGoogle, signInWithPhone, verifyOTP } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  userType: 'builder' | 'customer';
  onSignupClick: () => void;
}

export default function AuthForm({ userType, onSignupClick }: AuthFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'phone'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'phone') {
        if (!otp) {
          const { error } = await signInWithPhone(phoneNumber);
          if (error) throw error;
        } else {
          const { error } = await verifyOTP(phoneNumber, otp);
          if (error) throw error;
          
          // Redirect after successful phone login
          if (userType === 'builder') {
            navigate('/builder/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        // Redirect after successful login
        if (userType === 'builder') {
          navigate('/builder/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        alert('Password reset instructions sent to your email');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Redirect will happen automatically via OAuth callback
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode('phone')}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Phone className="w-5 h-5" />
          Continue with Phone
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'phone' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            {otp && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter verification code"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'phone' 
            ? (otp ? 'Verify Code' : 'Send Code')
            : (mode === 'login' ? 'Sign In' : 'Send Reset Instructions')}
        </button>

        <div className="text-sm text-center">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSignupClick}
                className="text-blue-600 hover:text-blue-500"
              >
                Sign up
              </button>
            </>
          ) : mode === 'phone' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setPhoneNumber('');
                setOtp('');
              }}
              className="text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </button>
          )}
        </div>

        {mode === 'login' && (
          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </form>
    </div>
  );
}