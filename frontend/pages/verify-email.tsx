import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { token } = router.query;

  useEffect(() => {
    if (token && typeof token === 'string') {
      handleVerification(token);
    } else if (router.isReady) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, [token, router.isReady]);

  const handleVerification = async (verificationToken: string) => {
    try {
      setStatus('loading');
      const success = await verifyEmail(verificationToken);
      
      if (success) {
        setStatus('success');
        setMessage('Your email has been verified successfully! Your account is now eligible for admin review.');
      } else {
        setStatus('error');
        setMessage('Verification failed. The link may be expired or invalid.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verifying Your Email
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              ✅ Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. Our admin team will review your account</li>
                <li>2. You'll receive an email once approved</li>
                <li>3. Login to access your $1,000 welcome balance</li>
                <li>4. Start banking with LumaTrust!</li>
              </ol>
            </div>
            <div className="space-y-3">
              <Link href="/login" className="btn-primary w-full block text-center">
                Go to Login
              </Link>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                Return to Home
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ❌ Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Need Help?</h3>
              <p className="text-sm text-yellow-700">
                If you continue to have issues, please register again or contact support.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/register" className="btn-primary w-full block text-center">
                Register Again
              </Link>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                Return to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}