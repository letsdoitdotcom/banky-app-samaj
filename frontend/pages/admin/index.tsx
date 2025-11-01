import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, userAPI, formatCurrency, formatDate, getTransactionStatusClass, handleAPIError } from '../../lib/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idNumber: string;
  verified: boolean;
  emailVerified: boolean;
  approved: boolean;
  accountNumber?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  _id: string;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  type: 'internal' | 'external' | 'deposit';
  status: 'pending' | 'completed' | 'failed';
  narration?: string;
  createdAt: string;
  senderName?: string;
  receiverName?: string;
  adminComment?: string;
  processedBy?: string;
  processedAt?: string;
}

interface Stats {
  emailUnverified: number;
  emailVerified: number;
  pending: number;
  approved: number;
  total: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, logout, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'inject-transactions'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ emailUnverified: 0, emailVerified: 0, pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;
    
    if (!isAuthenticated || !admin) {
      router.push('/admin-login');
      return;
    }
    
    fetchData();
  }, [isAuthenticated, admin, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, transactionsResponse] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getTransactions()
      ]);

      const usersData = usersResponse.data;
      setUsers(usersData.approvedUsers || []);
      setPendingUsers(usersData.pendingUsers || []);
      setUnverifiedUsers(usersData.unverifiedUsers || []);
      setStats(usersData.stats || { emailUnverified: 0, emailVerified: 0, pending: 0, approved: 0, total: 0 });

      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await adminAPI.approveUser(userId);
      toast.success('User approved successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    }
  };

  const handleApproveTransaction = async (transactionId: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'approve' : 'reject';
    const comment = prompt(`Please enter a comment for this ${actionText}al (optional):`);
    
    try {
      toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} transaction...`, { id: 'transaction-action' });
      
      await adminAPI.approveTransaction({
        transactionId,
        action,
        adminComment: comment || undefined
      });

      toast.success(`Transaction ${actionText}d successfully!`, { id: 'transaction-action' });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error(`Transaction ${actionText} error:`, error);
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage, { id: 'transaction-action' });
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpandedUsers = new Set(expandedUsers);
    if (newExpandedUsers.has(userId)) {
      newExpandedUsers.delete(userId);
    } else {
      newExpandedUsers.add(userId);
    }
    setExpandedUsers(newExpandedUsers);
  };

  const handleTestSimple = async () => {
    try {
      toast.loading('Testing API connection...', { id: 'test-api' });
      
      // Try health endpoint first
      console.log('🔍 Testing health endpoint...');
      const healthResponse = await fetch('https://banky-app-samaj.vercel.app/api/health');
      console.log('Health response:', healthResponse.status, healthResponse.statusText);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check passed:', healthData);
      }
      
      // Then test our simple endpoint
      console.log('🔍 Testing simple endpoint...');
      const response = await fetch('https://banky-app-samaj.vercel.app/api/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'simple' })
      });

      console.log('Simple endpoint response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        toast.success('API connection working!', { id: 'test-api' });
        console.log('✅ API test result:', data);
      } else {
        const errorText = await response.text();
        toast.error(`API test failed: ${response.status}`, { id: 'test-api' });
        console.error('❌ API test error:', errorText);
      }
    } catch (error) {
      console.error('API test error:', error);
      toast.error('API connection failed', { id: 'test-api' });
    }
  };

  const handleTestEmailSimple = async () => {
    const email = prompt('Enter email address to test:');
    if (!email) return;

    try {
      toast.loading('Testing email configuration...', { id: 'test-email-simple' });
      
      const response = await fetch('https://banky-app-samaj.vercel.app/api/test-email-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Email configuration working!', { id: 'test-email-simple' });
        console.log('✅ Email config result:', data);
      } else {
        toast.error(`Email config issue: ${data.error}`, { id: 'test-email-simple' });
        console.error('❌ Email config error:', data);
      }
    } catch (error) {
      console.error('Email config test error:', error);
      toast.error('Email configuration test failed', { id: 'test-email-simple' });
    }
  };

  const handleTestEmail = async () => {
    const email = prompt('Enter email address to test:');
    if (!email) return;

    try {
      toast.loading('Sending test email...', { id: 'test-email' });
      
      const response = await adminAPI.testEmail(email);
      
      toast.success('Test email sent successfully!', { id: 'test-email' });
      console.log('✅ Email test result:', response.data);
      
    } catch (error) {
      console.error('Test email error:', error);
      const errorMessage = handleAPIError(error);
      toast.error(`Failed to send test email: ${errorMessage}`, { id: 'test-email' });
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin-login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    
    try {
      await adminAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
            <Link href="/admin" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LumaTrust Admin</h1>
                <p className="text-sm text-gray-600">Administrator Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mr-2">
                🏠 Home
              </Link>
              <button
                onClick={handleTestSimple}
                className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors mr-2"
                title="Test API Connection"
              >
                🔗 Test API
              </button>
              <button
                onClick={handleTestEmailSimple}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mr-2"
                title="Test Email (Simple)"
              >
                📧 Simple Email
              </button>
              <button
                onClick={handleTestEmail}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                title="Test Email Configuration"
              >
                📧 Full Email
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-600">{admin?.email}</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors mr-2"
                title="Change Password"
              >
                🔑 Change Password
              </button>
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
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👥 Users ({pendingUsers.length} pending)
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              💳 Transactions
            </button>
            <button
              onClick={() => setActiveTab('inject-transactions')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'inject-transactions'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🎯 Inject History
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <span className="text-blue-600 text-xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100">
                      <span className="text-red-600 text-xl">📧</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Email Unverified</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.emailUnverified}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <span className="text-yellow-600 text-xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Approved Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <span className="text-purple-600 text-xl">💳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                  <div className="space-y-3">
                    {pendingUsers.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <button
                          onClick={() => handleApproveUser(user._id)}
                          className="btn-success text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                    {pendingUsers.length === 0 && (
                      <p className="text-gray-600 text-center py-4">No pending approvals</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.senderName || transaction.senderAccount} → {transaction.receiverName || transaction.receiverAccount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.senderAccount} → {transaction.receiverAccount}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${getTransactionStatusClass(transaction.status)}`}>
                            {transaction.status}
                          </span>
                          {transaction.status === 'pending' && (
                            <div className="mt-1">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                Needs Approval
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-gray-600 text-center py-4">No recent transactions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <button
                  onClick={fetchData}
                  className="btn-primary"
                >
                  Refresh
                </button>
              </div>

              {/* Email Unverified Users */}
              {unverifiedUsers.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ❌ Email Unverified Users ({unverifiedUsers.length})
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> These users have registered but haven't verified their email yet. 
                      Only email-verified users are eligible for approval.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-cell font-medium text-gray-900">Name</th>
                          <th className="table-cell font-medium text-gray-900">Email</th>
                          <th className="table-cell font-medium text-gray-900">Phone</th>
                          <th className="table-cell font-medium text-gray-900">Registered</th>
                          <th className="table-cell font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {unverifiedUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="table-cell font-medium text-gray-900">{user.name}</td>
                            <td className="table-cell text-gray-600">{user.email}</td>
                            <td className="table-cell text-gray-600">{user.phone}</td>
                            <td className="table-cell text-gray-600">{formatDate(user.createdAt)}</td>
                            <td className="table-cell">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Email Not Verified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pending Users (Email Verified, Awaiting Approval) */}
              {pendingUsers.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ⏳ Email Verified - Pending Approval ({pendingUsers.length})
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Ready for Approval:</strong> These users have verified their email addresses 
                      and are eligible for admin approval.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-cell font-medium text-gray-900">Name</th>
                          <th className="table-cell font-medium text-gray-900">Email</th>
                          <th className="table-cell font-medium text-gray-900">Phone</th>
                          <th className="table-cell font-medium text-gray-900">Registered</th>
                          <th className="table-cell font-medium text-gray-900">Email Status</th>
                          <th className="table-cell font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingUsers.map((user) => (
                          <React.Fragment key={user._id}>
                            <tr className="hover:bg-gray-50">
                              <td className="table-cell font-medium text-gray-900">{user.name}</td>
                              <td className="table-cell text-gray-600">{user.email}</td>
                              <td className="table-cell text-gray-600">{user.phone}</td>
                              <td className="table-cell text-gray-600">{formatDate(user.createdAt)}</td>
                              <td className="table-cell">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Email Verified
                                </span>
                              </td>
                              <td className="table-cell">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveUser(user._id)}
                                    className="btn-success text-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => toggleUserExpansion(user._id)}
                                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                                  >
                                    <span>{expandedUsers.has(user._id) ? '▼' : '▶'}</span>
                                    <span>Details</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedUsers.has(user._id) && (
                              <tr>
                                <td colSpan={6} className="p-0">
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-l-4 border-green-400">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {/* Personal Information */}
                                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                          <span className="text-blue-600 mr-2">👤</span>
                                          Personal Information
                                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔒 SENSITIVE</span>
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="font-medium text-gray-600">Full Legal Name:</span>
                                            <span className="ml-2 text-gray-900 font-medium">{user.name}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Email Address:</span>
                                            <span className="ml-2 text-gray-900">{user.email}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Phone Number:</span>
                                            <span className="ml-2 text-gray-900">{user.phone}</span>
                                          </div>
                                          <div className="bg-red-50 p-2 rounded border border-red-200">
                                            <span className="font-medium text-red-700">🆔 SSN/ID Number:</span>
                                            <span className="ml-2 text-red-900 font-mono font-bold">{user.idNumber}</span>
                                            <div className="text-xs text-red-600 mt-1">⚠️ Highly Sensitive - PII Data</div>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Registration Date:</span>
                                            <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Last Updated:</span>
                                            <span className="ml-2 text-gray-900">{formatDate(user.updatedAt)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Address Information */}
                                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                          <span className="text-green-600 mr-2">📍</span>
                                          Address Information
                                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🔒 PRIVATE</span>
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                            <span className="font-medium text-yellow-700">🏠 Complete Address:</span>
                                            <div className="ml-2 text-yellow-900 font-medium mt-1">
                                              {user.address.street}<br/>
                                              {user.address.city}, {user.address.state} {user.address.zipCode}<br/>
                                              {user.address.country}
                                            </div>
                                            <div className="text-xs text-yellow-600 mt-1">⚠️ Residential Information - Handle with Care</div>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Street Address:</span>
                                            <span className="ml-2 text-gray-900">{user.address.street}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">City:</span>
                                            <span className="ml-2 text-gray-900">{user.address.city}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">State/Province:</span>
                                            <span className="ml-2 text-gray-900">{user.address.state}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">ZIP/Postal Code:</span>
                                            <span className="ml-2 text-gray-900 font-mono">{user.address.zipCode}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Country:</span>
                                            <span className="ml-2 text-gray-900">{user.address.country}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Account Information */}
                                      <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                          <span className="text-orange-600 mr-2">⏳</span>
                                          Approval Status
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="font-medium text-gray-600">Email Verified:</span>
                                            <span className="ml-2 text-green-600">✅ Yes</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Account Status:</span>
                                            <span className="ml-2 text-orange-600">⏳ Pending Approval</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Registered:</span>
                                            <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 flex justify-end space-x-3">
                                      <button
                                        onClick={() => handleApproveUser(user._id)}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                      >
                                        ✅ Approve User
                                      </button>
                                      <button
                                        onClick={() => toggleUserExpansion(user._id)}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                                      >
                                        Collapse Details
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Approved Users */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approved Users ({users.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell font-medium text-gray-900">Name</th>
                        <th className="table-cell font-medium text-gray-900">Email</th>
                        <th className="table-cell font-medium text-gray-900">Account Number</th>
                        <th className="table-cell font-medium text-gray-900">Balance</th>
                        <th className="table-cell font-medium text-gray-900">Status</th>
                        <th className="table-cell font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <React.Fragment key={user._id}>
                          <tr className="hover:bg-gray-50">
                            <td className="table-cell font-medium text-gray-900">{user.name}</td>
                            <td className="table-cell text-gray-600">{user.email}</td>
                            <td className="table-cell text-gray-600 font-mono">{user.accountNumber}</td>
                            <td className="table-cell text-gray-600">{formatCurrency(user.balance)}</td>
                            <td className="table-cell">
                              <span className="badge badge-success">Active</span>
                            </td>
                            <td className="table-cell">
                              <button
                                onClick={() => toggleUserExpansion(user._id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                              >
                                <span>{expandedUsers.has(user._id) ? '▼' : '▶'}</span>
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                          {expandedUsers.has(user._id) && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-l-4 border-blue-400">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Personal Information */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="text-blue-600 mr-2">👤</span>
                                        Personal Information
                                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">🔒 SENSITIVE</span>
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-600">Full Legal Name:</span>
                                          <span className="ml-2 text-gray-900 font-medium">{user.name}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Email Address:</span>
                                          <span className="ml-2 text-gray-900">{user.email}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Phone Number:</span>
                                          <span className="ml-2 text-gray-900">{user.phone}</span>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border border-red-200">
                                          <span className="font-medium text-red-700">🆔 SSN/ID Number:</span>
                                          <span className="ml-2 text-red-900 font-mono font-bold">{user.idNumber}</span>
                                          <div className="text-xs text-red-600 mt-1">⚠️ Highly Sensitive - PII Data</div>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Registration Date:</span>
                                          <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Last Updated:</span>
                                          <span className="ml-2 text-gray-900">{formatDate(user.updatedAt)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Address Information */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="text-green-600 mr-2">📍</span>
                                        Address Information
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🔒 PRIVATE</span>
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                          <span className="font-medium text-yellow-700">🏠 Complete Address:</span>
                                          <div className="ml-2 text-yellow-900 font-medium mt-1">
                                            {user.address.street}<br/>
                                            {user.address.city}, {user.address.state} {user.address.zipCode}<br/>
                                            {user.address.country}
                                          </div>
                                          <div className="text-xs text-yellow-600 mt-1">⚠️ Residential Information - Handle with Care</div>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Street Address:</span>
                                          <span className="ml-2 text-gray-900">{user.address.street}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">City:</span>
                                          <span className="ml-2 text-gray-900">{user.address.city}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">State/Province:</span>
                                          <span className="ml-2 text-gray-900">{user.address.state}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">ZIP/Postal Code:</span>
                                          <span className="ml-2 text-gray-900 font-mono">{user.address.zipCode}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Country:</span>
                                          <span className="ml-2 text-gray-900">{user.address.country}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Account Information */}
                                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-400">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="text-purple-600 mr-2">🏦</span>
                                        Financial Account Details
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">💰 FINANCIAL</span>
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="bg-green-50 p-2 rounded border border-green-200">
                                          <span className="font-medium text-green-700">🏦 Account Number:</span>
                                          <span className="ml-2 text-green-900 font-mono font-bold text-lg">{user.accountNumber}</span>
                                          <div className="text-xs text-green-600 mt-1">💳 LumaTrust Primary Account</div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                          <span className="font-medium text-blue-700">💰 Current Balance:</span>
                                          <span className="ml-2 text-blue-900 font-bold text-lg">{formatCurrency(user.balance)}</span>
                                          <div className="text-xs text-blue-600 mt-1">💵 Available Funds</div>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Email Verification:</span>
                                          <span className={`ml-2 ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                                            {user.emailVerified ? '✅ Verified' : '❌ Unverified'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Account Status:</span>
                                          <span className={`ml-2 ${user.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {user.approved ? '✅ Active & Approved' : '⏳ Pending Review'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Account Type:</span>
                                          <span className="ml-2 text-gray-900">Individual Banking Account</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Account Opened:</span>
                                          <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Last Activity:</span>
                                          <span className="ml-2 text-gray-900">{formatDate(user.updatedAt)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                      onClick={() => toggleUserExpansion(user._id)}
                                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                                    >
                                      Collapse Details
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
                <button
                  onClick={fetchData}
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
                        <th className="table-cell font-medium text-gray-900">Amount</th>
                        <th className="table-cell font-medium text-gray-900">From</th>
                        <th className="table-cell font-medium text-gray-900">To</th>
                        <th className="table-cell font-medium text-gray-900">Type</th>
                        <th className="table-cell font-medium text-gray-900">Status</th>
                        <th className="table-cell font-medium text-gray-900">Date</th>
                        <th className="table-cell font-medium text-gray-900">Description</th>
                        <th className="table-cell font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td className="table-cell font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="table-cell text-gray-600">
                            <div>
                              <div className="font-medium">{transaction.senderName || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{transaction.senderAccount}</div>
                            </div>
                          </td>
                          <td className="table-cell text-gray-600">
                            <div>
                              <div className="font-medium">{transaction.receiverName || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{transaction.receiverAccount}</div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${
                              transaction.type === 'internal' ? 'badge-info' : 
                              transaction.type === 'deposit' ? 'badge-success' : 'badge-warning'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${getTransactionStatusClass(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="table-cell text-gray-600">{formatDate(transaction.createdAt)}</td>
                          <td className="table-cell text-gray-600">
                            <div className="max-w-xs truncate" title={transaction.narration}>
                              {transaction.narration || 'No description'}
                            </div>
                          </td>
                          <td className="table-cell">
                            {transaction.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveTransaction(transaction._id, 'approve')}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                  title="Approve Transaction"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleApproveTransaction(transaction._id, 'reject')}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                  title="Reject Transaction"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {transaction.status === 'completed' ? '✓ Processed' : '✗ Rejected'}
                                {transaction.processedAt && (
                                  <div className="text-xs">{formatDate(transaction.processedAt)}</div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inject-transactions' && (
            <TransactionInjectionTab users={users} />
          )}
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.current ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464 9.878 9.878zM14.121 14.121L15.535 15.535 14.121 14.121z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.new ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464 9.878 9.878zM14.121 14.121L15.535 15.535 14.121 14.121z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPasswords.confirm ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464 9.878 9.878zM14.121 14.121L15.535 15.535 14.121 14.121z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Transaction Injection Component
interface TransactionInjectionTabProps {
  users: User[];
}

function TransactionInjectionTab({ users }: TransactionInjectionTabProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [totalTransactions, setTotalTransactions] = useState<number>(100);
  const [incomingPercentage, setIncomingPercentage] = useState<number>(60);
  const [isInjecting, setIsInjecting] = useState(false);

  // Get approved users only
  const approvedUsers = users.filter(user => user.approved && user.accountNumber);

  const handleInjectTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !startDate || !endDate || !totalTransactions) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    if (totalTransactions < 1 || totalTransactions > 10000) {
      toast.error('Total transactions must be between 1 and 10,000');
      return;
    }

    try {
      setIsInjecting(true);
      
      const response = await adminAPI.injectTransactions({
        targetUserId: selectedUser,
        startDate,
        endDate,
        totalTransactions,
        incomingPercentage
      });

      toast.success(`Successfully injected ${response.data.summary.totalTransactions} transactions!`, {
        duration: 5000
      });

      // Reset form
      setSelectedUser('');
      setStartDate('');
      setEndDate('');
      setTotalTransactions(100);
      setIncomingPercentage(60);

    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History Injection</h2>
          <p className="text-gray-600 mt-2">Generate realistic transaction history for user accounts</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
          <span className="text-purple-700 text-sm font-medium">🎯 Admin Tool</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <span className="text-yellow-600 text-xl mr-3">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This tool generates realistic transaction history for testing purposes. 
              It will affect the user's account balance and create permanent transaction records.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleInjectTransactions} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div>
              <label className="form-label">
                Target User *
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select a user...</option>
                {approvedUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.accountNumber} (Balance: {formatCurrency(user.balance)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                Only approved users with account numbers are shown
              </p>
            </div>

            {/* Total Transactions */}
            <div>
              <label className="form-label">
                Total Transactions *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={totalTransactions}
                onChange={(e) => setTotalTransactions(parseInt(e.target.value) || 0)}
                className="form-input"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Number of transactions to generate (1-10,000)
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="form-label">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Beginning of transaction history period
              </p>
            </div>

            {/* End Date */}
            <div>
              <label className="form-label">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                End of transaction history period
              </p>
            </div>

            {/* Incoming Percentage */}
            <div className="md:col-span-2">
              <label className="form-label">
                Incoming vs Outgoing Ratio: {incomingPercentage}% incoming, {100 - incomingPercentage}% outgoing
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={incomingPercentage}
                onChange={(e) => setIncomingPercentage(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10% incoming</span>
                <span>50% incoming</span>
                <span>90% incoming</span>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {selectedUser && startDate && endDate && totalTransactions > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Injection Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Total Transactions:</span>
                  <div className="text-blue-800">{totalTransactions.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Incoming:</span>
                  <div className="text-green-700">{Math.round(totalTransactions * (incomingPercentage / 100)).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Outgoing:</span>
                  <div className="text-red-700">{Math.round(totalTransactions * ((100 - incomingPercentage) / 100)).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Date Range:</span>
                  <div className="text-blue-800">{Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days</div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setSelectedUser('');
                setStartDate('');
                setEndDate('');
                setTotalTransactions(100);
                setIncomingPercentage(60);
              }}
              className="btn-secondary"
              disabled={isInjecting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isInjecting || !selectedUser || !startDate || !endDate || !totalTransactions}
              className="btn-primary"
            >
              {isInjecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Injecting Transactions...
                </>
              ) : (
                '🎯 Inject Transaction History'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-green-50 border-green-200">
          <h4 className="text-green-800 font-medium mb-2">✨ What This Tool Does</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Generates realistic transaction history</li>
            <li>• Distributes transactions randomly across date range</li>
            <li>• Creates varied transaction types (salary, rent, groceries, etc.)</li>
            <li>• Updates user account balance automatically</li>
            <li>• Uses realistic amounts and descriptions</li>
          </ul>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <h4 className="text-purple-800 font-medium mb-2">🎲 Randomization Features</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Random dates within specified range</li>
            <li>• Varied daily transaction counts (0-5 per day)</li>
            <li>• Different transaction amounts by category</li>
            <li>• Mix of internal and external transactions</li>
            <li>• Realistic sender/receiver names</li>
          </ul>
        </div>
      </div>
    </div>
  );
}