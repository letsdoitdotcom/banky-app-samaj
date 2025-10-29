import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { userAPI, formatCurrency, formatDate, getTransactionStatusClass, handleAPIError } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  accountNumber: string;
  balance: number;
  verified: boolean;
  approved: boolean;
  idNumber: string;
  createdAt: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  identity?: {
    type: string;
    number: string;
  };
}

interface Transaction {
  _id: string;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  type: 'internal' | 'external';
  status: 'pending' | 'completed' | 'failed';
  narration?: string;
  createdAt: string;
  senderName?: string;
}

interface TransferForm {
  receiverAccount: string;
  amount: string;
  narration: string;
  bankName: string;
}

interface DepositForm {
  amount: string;
}

// Bank options for transfers
const BANK_OPTIONS = [
  { value: 'BankyApp', label: 'BankyApp (Internal)' },
  { value: 'Chase', label: 'Chase Bank' },
  { value: 'BankOfAmerica', label: 'Bank of America' },
  { value: 'Wells Fargo', label: 'Wells Fargo' },
  { value: 'Citibank', label: 'Citibank' },
  { value: 'US Bank', label: 'US Bank' },
  { value: 'PNC', label: 'PNC Bank' },
  { value: 'Capital One', label: 'Capital One' },
  { value: 'TD Bank', label: 'TD Bank' },
  { value: 'Truist', label: 'Truist Bank' }
];

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'transfer' | 'history'>('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  
  const [transferForm, setTransferForm] = useState<TransferForm>({
    receiverAccount: '',
    amount: '',
    narration: '',
    bankName: ''
  });

  const [depositForm, setDepositForm] = useState<DepositForm>({
    amount: ''
  });

  useEffect(() => {
    // Don't redirect if we're still loading auth state
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Check if this is a regular user (not admin)
    if (user && user.role === 'admin') {
      router.push('/admin');
      return;
    }
    
    // If we have a user, fetch their data
    if (user) {
      fetchUserData();
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile and transactions with better error handling
      const [profileResponse, transactionsResponse] = await Promise.all([
        userAPI.getProfile().catch(err => {
          console.error('Profile fetch error:', err);
          throw new Error('Failed to load profile data');
        }),
        userAPI.getTransactions().catch(err => {
          console.error('Transactions fetch error:', err);
          // Don't fail the whole request if transactions fail
          return { data: { transactions: [] } };
        })
      ]);


      
      // Validate profile data
      if (!profileResponse.data?.user) {
        throw new Error('Invalid profile data received');
      }
      
      setUserDetails(profileResponse.data.user);
      setTransactions(transactionsResponse.data.transactions || []);
      
      // Show success message on manual refresh
      if (!loading) {
        toast.success('Account data refreshed successfully');
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      const errorMessage = error.message || 'Failed to load account data';
      toast.error(errorMessage);
      
      // If profile fails completely, user should be logged out
      if (error.message?.includes('profile')) {
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferForm.bankName || !transferForm.receiverAccount || !transferForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (userDetails && amount > (userDetails.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    // Determine if it's internal or external transfer
    const transferType = transferForm.bankName === 'BankyApp' ? 'internal' : 'external';

    try {
      setTransferLoading(true);
      await userAPI.createTransfer({
        receiverAccount: transferForm.receiverAccount,
        amount: amount,
        narration: transferForm.narration,
        type: transferType
      });

      const successMessage = transferType === 'internal' 
        ? 'Internal transfer completed successfully!'
        : 'External transfer initiated successfully! Processing may take 1-3 business days.';
      
      toast.success(successMessage, { duration: 5000 });
      setTransferForm({ receiverAccount: '', amount: '', narration: '', bankName: '' });
      setActiveTab('history');
      fetchUserData(); // Refresh data
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositForm.amount) {
      toast.error('Please enter an amount to deposit');
      return;
    }

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > 10000) {
      toast.error('Maximum deposit amount is $10,000');
      return;
    }

    try {
      setDepositLoading(true);
      
      // Show processing message for 2 seconds to simulate bank processing
      toast.loading('Processing deposit...', { id: 'deposit-processing' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actually process the deposit
      const response = await userAPI.deposit({
        amount: amount,
        description: 'Bank Deposit'
      });
      
      toast.success('Deposit completed successfully! Your balance has been updated.', {
        id: 'deposit-processing',
        duration: 5000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
      setDepositForm({ amount: '' });
      
      // Refresh user data to show updated balance and transaction history
      await fetchUserData();
      
      // Navigate to overview to see updated balance
      setTimeout(() => {
        setActiveTab('overview');
      }, 1000);
      
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, { id: 'deposit-processing' });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Function to handle smooth tab transitions
  const handleTabChange = (newTab: 'overview' | 'deposit' | 'transfer' | 'history') => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150); // 150ms transition
  };

  // Function to mask sensitive information
  const maskSensitiveInfo = (value: string, showFirst: number = 3, showLast: number = 4) => {
    if (!value || value.length <= showFirst + showLast) return value;
    const masked = '*'.repeat(value.length - showFirst - showLast);
    return `${value.substring(0, showFirst)}${masked}${value.substring(value.length - showLast)}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-blue-300 animate-ping"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Loading your dashboard</p>
            <p className="text-sm text-gray-500">Please wait while we fetch your account information</p>
          </div>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Information Unavailable</h2>
          <p className="text-gray-600 mb-6">
            We're having trouble loading your account information. This might be a temporary issue.
          </p>
          <div className="space-y-3">
            <button 
              onClick={fetchUserData} 
              className="btn-primary w-full"
            >
              🔄 Try Again
            </button>
            <button 
              onClick={() => router.push('/login')} 
              className="btn-secondary w-full"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile-Responsive Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm sm:text-lg">⚡</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BankyApp
                </h1>
                <p className="hidden sm:block text-xs sm:text-sm text-gray-600">Your Digital Banking Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              {/* Mobile Balance Display */}
              <div className="block md:hidden text-right">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(userDetails.balance || 0)}</p>
              </div>
              {/* Desktop User Info */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {userDetails.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{userDetails.name}</p>
                      <p className="text-xs text-gray-600 font-mono">{userDetails.accountNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(userDetails.balance || 0)}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                <span>🚪</span>
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Mobile Navigation */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              🏠 Overview
            </button>
            <button
              onClick={() => handleTabChange('deposit')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'deposit'
                  ? 'bg-green-600 text-white transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              💰 Deposit
            </button>
            <button
              onClick={() => handleTabChange('transfer')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'transfer'
                  ? 'bg-purple-600 text-white transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              💸 Transfer
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              📋 History
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 bg-white shadow-lg min-h-screen border-r border-gray-200">
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
              <p className="text-sm text-gray-600">Manage your banking activities</p>
            </div>
            <nav className="space-y-3">
              <button
                onClick={() => handleTabChange('overview')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-102'
                }`}
              >
                <span className="text-xl">🏠</span>
                <span className="font-medium">Overview</span>
              </button>
              <button
                onClick={() => handleTabChange('deposit')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                  activeTab === 'deposit'
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-102'
                }`}
              >
                <span className="text-xl">💰</span>
                <span className="font-medium">Deposit Funds</span>
              </button>
              <button
                onClick={() => handleTabChange('transfer')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                  activeTab === 'transfer'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-102'
                }`}
              >
                <span className="text-xl">💸</span>
                <span className="font-medium">Transfer Money</span>
              </button>
              <button
                onClick={() => handleTabChange('history')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-102'
                }`}
              >
                <span className="text-xl">📋</span>
                <span className="font-medium">Transaction History</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Account Overview</h2>
                  <p className="text-gray-600 text-sm sm:text-base">Welcome back, {userDetails.name}! Here's your account summary.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => handleTabChange('deposit')}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <span>💰</span>
                    <span className="hidden sm:inline">Deposit</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('transfer')}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <span>💸</span>
                    <span className="hidden sm:inline">Transfer</span>
                  </button>
                  <button
                    onClick={fetchUserData}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base"
                  >
                    <span>🔄</span>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Account Balance Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12"></div>
                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                    <div className="mb-4 sm:mb-0">
                      <p className="text-blue-100 text-sm font-medium mb-2">Available Balance</p>
                      <p className="text-2xl sm:text-4xl font-bold tracking-tight">{formatCurrency(userDetails.balance || 0)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-blue-100 text-sm font-medium mb-2">Account Number</p>
                      <p className="text-lg sm:text-xl font-mono tracking-wider">{userDetails.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-blue-100">Account Active</span>
                    </div>
                    <div className="text-sm text-blue-100">
                      {userDetails.verified ? '✅ Verified' : '⏳ Pending Verification'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <span className="text-green-600 text-xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <span className="text-blue-600 text-xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="text-lg font-semibold text-green-600">
                        {userDetails.approved ? 'Active' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <span className="text-purple-600 text-xl">🔒</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Verification Status</p>
                      <p className="text-lg font-semibold text-green-600">
                        {userDetails.verified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <button
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                      <span>
                        {showSensitiveInfo ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 00-.007 4.243m4.242-4.242L15.536 8.464M14.122 14.122a3 3 0 01-4.243 0M14.122 14.122l4.242 4.242" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </span>
                      <span>{showSensitiveInfo ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{userDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">
                        {showSensitiveInfo ? userDetails.email : maskSensitiveInfo(userDetails.email, 3, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">
                        {showSensitiveInfo ? userDetails.phone : maskSensitiveInfo(userDetails.phone, 3, 4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Social Security Number</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 font-mono">
                          {showSensitiveInfo ? userDetails.idNumber : maskSensitiveInfo(userDetails.idNumber, 3, 4)}
                        </p>
                        {!showSensitiveInfo && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            🔒 Protected
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Registration Date</p>
                      <p className="font-medium text-gray-900">{formatDate(userDetails.createdAt)}</p>
                    </div>
                    {userDetails.identity && (
                      <div>
                        <p className="text-sm text-gray-600">Identity Document</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.identity.type}: {
                            showSensitiveInfo 
                              ? userDetails.identity.number 
                              : maskSensitiveInfo(userDetails.identity.number, 3, 4)
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address & Account Details</h3>
                  {userDetails.address ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Street Address</p>
                        <p className="font-medium text-gray-900">
                          {showSensitiveInfo ? userDetails.address.street : maskSensitiveInfo(userDetails.address.street, 6, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="font-medium text-gray-900">{userDetails.address.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">State / Province</p>
                        <p className="font-medium text-gray-900">{userDetails.address.state}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ZIP Code / Postal Code</p>
                        <p className="font-medium text-gray-900">
                          {showSensitiveInfo ? userDetails.address.zipCode : maskSensitiveInfo(userDetails.address.zipCode, 2, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Country</p>
                        <p className="font-medium text-gray-900">{userDetails.address.country}</p>
                      </div>
                      
                      {/* Account Security Information */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Security</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">Email Verification</span>
                            <span className={`badge ${userDetails.verified ? 'badge-success' : 'badge-warning'}`}>
                              {userDetails.verified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">Account Approval</span>
                            <span className={`badge ${userDetails.approved ? 'badge-success' : 'badge-warning'}`}>
                              {userDetails.approved ? '✅ Approved' : '⏳ Pending Review'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">Account Type</span>
                            <span className="badge badge-info">Individual Banking</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">Security Level</span>
                            <span className="badge badge-success">🔒 High Security</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Address information not available</p>
                  )}
                </div>
              </div>

              {/* Sensitive Information Panel */}
              <div className="card bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">🛡️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sensitive Information</h3>
                      <p className="text-sm text-gray-600">Complete personal and financial details</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                      🔐 Protected Data
                    </span>
                    <button
                      onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        showSensitiveInfo
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {showSensitiveInfo ? '🔒 Hide Details' : '👁️ Show Details'}
                    </button>
                  </div>
                </div>
                
                {showSensitiveInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Financial Information */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-green-600 mr-2">💰</span>
                        Financial Details
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Account Number</p>
                          <p className="font-mono text-sm font-medium">{userDetails.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Current Balance</p>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(userDetails.balance || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Account Status</p>
                          <p className="text-sm font-medium text-blue-600">Active & Operational</p>
                        </div>
                      </div>
                    </div>

                    {/* Identity Information */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-blue-600 mr-2">🆔</span>
                        Identity Details
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Full Legal Name</p>
                          <p className="text-sm font-medium">{userDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Social Security Number</p>
                          <p className="font-mono text-sm font-medium text-red-700">{userDetails.idNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Phone Number</p>
                          <p className="text-sm font-medium">{userDetails.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Address */}
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="text-purple-600 mr-2">📍</span>
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Email Address</p>
                          <p className="text-sm font-medium break-all">{userDetails.email}</p>
                        </div>
                        {userDetails.address && (
                          <>
                            <div>
                              <p className="text-xs text-gray-600">Full Address</p>
                              <p className="text-sm font-medium">
                                {userDetails.address.street}, {userDetails.address.city}, {userDetails.address.state} {userDetails.address.zipCode}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Country</p>
                              <p className="text-sm font-medium">{userDetails.address.country}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">🔒</span>
                    </div>
                    <p className="text-gray-600 font-medium">Sensitive information is hidden for security</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Click "Show Details" to view your complete personal and financial information
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-sm mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This information is highly sensitive. Never share your SSN, account details, or personal information with anyone. 
                        BankyApp will never ask for this information via email or phone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.senderAccount === userDetails.accountNumber ? 'Sent' : 'Received'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.senderAccount === userDetails.accountNumber 
                            ? `To: ${transaction.receiverAccount}`
                            : `From: ${transaction.senderAccount}`
                          }
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.senderAccount === userDetails.accountNumber 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {transaction.senderAccount === userDetails.accountNumber ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`badge ${getTransactionStatusClass(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-gray-600 text-center py-4">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Deposit Funds</h2>

              {/* Balance Display */}
              <div className="card bg-green-50 border-green-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-green-600">Current Balance</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(userDetails.balance || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Deposit Form */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Money to Your Account</h3>
                <form onSubmit={handleDeposit} className="space-y-6">
                  <div>
                    <label className="form-label">
                      Deposit Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10000"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ amount: e.target.value })}
                        className="form-input pl-8"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Minimum: $0.01 | Maximum: $10,000.00
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <span className="text-blue-600 text-xl mr-3">ℹ️</span>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Deposit Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Deposit requests are processed within 1-3 business days. You will receive an email confirmation once the deposit is completed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="btn-primary w-full"
                  >
                    {depositLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Deposit...
                      </>
                    ) : (
                      'Deposit'
                    )}
                  </button>
                </form>
              </div>

              {/* Deposit Methods Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Deposit Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-blue-100">
                      <span className="text-blue-600">🏧</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-600">1-3 business days</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-green-100">
                      <span className="text-green-600">💳</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Debit Card</p>
                      <p className="text-xs text-gray-600">Instant - 1 day</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-purple-100">
                      <span className="text-purple-600">📱</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Mobile Check</p>
                      <p className="text-xs text-gray-600">1-2 business days</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-yellow-100">
                      <span className="text-yellow-600">🏪</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Cash Deposit</p>
                      <p className="text-xs text-gray-600">Same day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Transfer Money</h2>

              {/* Balance Display */}
              <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <span className="text-blue-600 text-xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-blue-600">Available Balance</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(userDetails.balance || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Form */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Send Money</h3>
                <form onSubmit={handleTransfer} className="space-y-6">
                  <div>
                    <label className="form-label">
                      Recipient Bank *
                    </label>
                    <select
                      value={transferForm.bankName}
                      onChange={(e) => setTransferForm({ ...transferForm, bankName: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="">Select recipient's bank</option>
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank.value} value={bank.value}>
                          {bank.label}
                        </option>
                      ))}
                    </select>
                    {transferForm.bankName && (
                      <p className="text-xs text-gray-600 mt-1">
                        {transferForm.bankName === 'BankyApp' 
                          ? '✅ Internal transfer - Instant processing' 
                          : '⚠️ External transfer - 1-3 business days processing'
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">
                      Recipient Account Number *
                    </label>
                    <input
                      type="text"
                      value={transferForm.receiverAccount}
                      onChange={(e) => setTransferForm({ ...transferForm, receiverAccount: e.target.value })}
                      className="form-input"
                      placeholder="Enter recipient's account number"
                      required
                    />
                    {transferForm.bankName === 'BankyApp' && (
                      <p className="text-xs text-gray-600 mt-1">
                        Must be a valid BankyApp account number (10 digits)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={userDetails.balance || 0}
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                        className="form-input pl-8"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Maximum: {formatCurrency(userDetails.balance || 0)}
                    </p>
                  </div>

                  <div>
                    <label className="form-label">
                      Description (Optional)
                    </label>
                    <textarea
                      value={transferForm.narration}
                      onChange={(e) => setTransferForm({ ...transferForm, narration: e.target.value })}
                      className="form-input"
                      rows={3}
                      placeholder="What's this transfer for?"
                    />
                  </div>

                  <div className={`border rounded-lg p-4 ${
                    transferForm.bankName === 'BankyApp' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex">
                      <span className={`text-xl mr-3 ${
                        transferForm.bankName === 'BankyApp' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {transferForm.bankName === 'BankyApp' ? '✅' : '⚠️'}
                      </span>
                      <div>
                        <h4 className={`text-sm font-medium ${
                          transferForm.bankName === 'BankyApp' ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {transferForm.bankName === 'BankyApp' ? 'Internal Transfer' : 'External Transfer Notice'}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          transferForm.bankName === 'BankyApp' ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {transferForm.bankName === 'BankyApp' 
                            ? 'This transfer will be processed instantly and completed immediately.'
                            : 'External transfers may take 1-3 business days to process. Please verify the account number carefully as transfers cannot be reversed once processed.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="btn-primary w-full"
                  >
                    {transferLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Send Money'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
                <button
                  onClick={fetchUserData}
                  className="btn-primary"
                >
                  Refresh
                </button>
              </div>

              <div className="card">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell font-medium text-gray-900">Date</th>
                        <th className="table-cell font-medium text-gray-900">Type</th>
                        <th className="table-cell font-medium text-gray-900">Account</th>
                        <th className="table-cell font-medium text-gray-900">Amount</th>
                        <th className="table-cell font-medium text-gray-900">Status</th>
                        <th className="table-cell font-medium text-gray-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const isOutgoing = transaction.senderAccount === userDetails.accountNumber;
                        return (
                          <tr key={transaction._id}>
                            <td className="table-cell text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${isOutgoing ? 'badge-error' : 'badge-success'}`}>
                                {isOutgoing ? 'Sent' : 'Received'}
                              </span>
                            </td>
                            <td className="table-cell text-gray-600">
                              {isOutgoing ? transaction.receiverAccount : transaction.senderAccount}
                            </td>
                            <td className="table-cell">
                              <span className={`font-medium ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                                {isOutgoing ? '-' : '+'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${getTransactionStatusClass(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="table-cell text-gray-600">
                              {transaction.narration || 'No description'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No transactions found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your transaction history will appear here once you start using your account.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}