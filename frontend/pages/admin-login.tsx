import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { adminAPI, handleAPIError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface AdminLoginData {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const { setAdminSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginData>();

  const onSubmit = async (data: AdminLoginData) => {
    setIsLoading(true);

    try {
      const response = await adminAPI.login(data);
      setAdminSession(response.data.token, response.data.admin);
      
      toast.success('Admin login successful!');
      router.push('/admin');
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">⚡</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Portal
          </h2>
          <p className="text-gray-300">
            Secure administrator access to BankyApp
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">Admin Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email'
                  }
                })}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="admin@bankyapp.com"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your admin password"
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-danger w-full disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <h4 className="text-yellow-800 font-medium text-sm">Security Notice</h4>
                <p className="text-yellow-700 text-xs mt-1">
                  This is a restricted area. All admin activities are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-blue-800 font-medium text-sm mb-2">Demo Credentials</h4>
            <div className="text-blue-700 text-xs space-y-1">
              <p><strong>Email:</strong> admin@bankyapp.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>

          {/* Back to main site */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-600 hover:text-gray-500 text-sm">
              ← Back to BankyApp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}