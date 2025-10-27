import React from 'react';
import Link from 'next/link';

export default function VerificationPending() {
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
        </div>

        {/* Success Card */}
        <div className="card text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for registering with BankyApp. Your account has been created 
            and is currently pending verification.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <div className="text-blue-800 text-sm space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Check your email for a verification link</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Our admin team will review your application</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>You'll receive an approval notification within 24-48 hours</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
            
            <Link href="/" className="btn btn-secondary w-full">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@bankyapp.com" className="text-primary-600 hover:text-primary-700">
              support@bankyapp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}