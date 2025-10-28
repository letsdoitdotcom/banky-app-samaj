import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    isAdmin: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginAdmin, isAuthenticated, user, admin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if we're still loading auth state
    if (authLoading) return;
    
    if (isAuthenticated) {
      if (admin) {
        router.push('/admin');
      } else if (user) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, admin, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.isAdmin) {
        await loginAdmin(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">BankyApp</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Admin Toggle */}
            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Admin Login</span>
              </label>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot your password?
              </a>
            </div>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create Account
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Demo Credentials</h3>
          <div className="text-sm text-yellow-700">
            <p><strong>User:</strong> user@demo.com / password123</p>
            <p><strong>Admin:</strong> admin@demo.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}