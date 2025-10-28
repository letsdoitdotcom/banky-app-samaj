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
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  
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
      const [profileResponse, transactionsResponse] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getTransactions()
      ]);

      console.log('Dashboard - Profile Response:', profileResponse.data);
      console.log('Dashboard - User Balance:', profileResponse.data.user?.balance, 'Type:', typeof profileResponse.data.user?.balance);
      
      setUserDetails(profileResponse.data.user);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Error loading your account data');
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
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Deposit request submitted! Processing may take 1-3 business days.', {
        duration: 5000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
      setDepositForm({ amount: '' });
    } catch (error) {
      toast.error('Failed to process deposit request');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading your account information</p>
          <button onClick={() => router.push('/login')} className="btn-primary">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BankyApp</h1>
                <p className="text-sm text-gray-600">Your Digital Banking Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userDetails.name}</p>
                <p className="text-xs text-gray-600">{userDetails.accountNumber}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 Overview
            </button>
            <button
              onClick={() => setActiveTab('deposit')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'deposit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              💰 Deposit Funds
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'transfer'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              💸 Transfer Money
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 Transaction History
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Account Overview</h2>
                <button
                  onClick={fetchUserData}
                  className="btn-primary"
                >
                  Refresh
                </button>
              </div>

              {/* Account Balance Card */}
              <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Available Balance</p>
                    <p className="text-3xl font-bold">{formatCurrency(userDetails.balance || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Account Number</p>
                    <p className="text-lg font-mono">{userDetails.accountNumber}</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium text-gray-900">{userDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">{userDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{userDetails.phone}</p>
                    </div>
                    {userDetails.identity && (
                      <div>
                        <p className="text-sm text-gray-600">Identity Document</p>
                        <p className="font-medium text-gray-900">
                          {userDetails.identity.type}: {userDetails.identity.number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  {userDetails.address ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Street Address</p>
                        <p className="font-medium text-gray-900">{userDetails.address.street}</p>
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
                        <p className="font-medium text-gray-900">{userDetails.address.zipCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Country</p>
                        <p className="font-medium text-gray-900">{userDetails.address.country}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Address information not available</p>
                  )}
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
                      'Request Deposit'
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
        </main>
      </div>
    </div>
  );
}