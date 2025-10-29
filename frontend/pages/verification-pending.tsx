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
            <span className="text-2xl font-bold text-gray-900">LumaTrust</span>
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
            Thank you for registering with LumaTrust! We've sent a verification email to your inbox. 
            <strong>Please verify your email to make your account eligible for approval.</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">📧 Email Verification Required</h3>
            <div className="text-blue-800 text-sm space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <p><strong>Check your email</strong> for our verification message (check spam folder too)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <p><strong>Click the verification link</strong> to confirm your email address</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p><strong>Admin review</strong> - Your account becomes eligible for approval</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                <p><strong>Start banking</strong> with your $1,000 welcome balance!</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-yellow-800 text-xs">
              ⚠️ <strong>Important:</strong> Only email-verified accounts are eligible for admin approval. 
              The verification link expires in 24 hours.
            </p>
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
            <a href="mailto:support@lumatrust.com" className="text-primary-600 hover:text-primary-700">
              support@lumatrust.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}