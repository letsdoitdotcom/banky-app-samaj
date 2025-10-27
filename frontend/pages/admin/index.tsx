import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, userAPI, formatCurrency, formatDate, getTransactionStatusClass, handleAPIError } from '../../lib/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  approved: boolean;
  accountNumber?: string;
  balance: number;
  createdAt: string;
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

interface Stats {
  unverified: number;
  pending: number;
  approved: number;
  total: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ unverified: 0, pending: 0, approved: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setStats(usersData.stats || { unverified: 0, pending: 0, approved: 0, total: 0 });

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

  const handleLogout = () => {
    logout();
    router.push('/admin-login');
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
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BankyApp Admin</h1>
                <p className="text-sm text-gray-600">Administrator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-600">{admin?.email}</p>
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
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                            {transaction.senderAccount} → {transaction.receiverAccount}
                          </p>
                        </div>
                        <span className={`badge ${getTransactionStatusClass(transaction.status)}`}>
                          {transaction.status}
                        </span>
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

              {/* Pending Users */}
              {pendingUsers.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pending Approvals ({pendingUsers.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-cell font-medium text-gray-900">Name</th>
                          <th className="table-cell font-medium text-gray-900">Email</th>
                          <th className="table-cell font-medium text-gray-900">Phone</th>
                          <th className="table-cell font-medium text-gray-900">Registered</th>
                          <th className="table-cell font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="table-cell font-medium text-gray-900">{user.name}</td>
                            <td className="table-cell text-gray-600">{user.email}</td>
                            <td className="table-cell text-gray-600">{user.phone}</td>
                            <td className="table-cell text-gray-600">{formatDate(user.createdAt)}</td>
                            <td className="table-cell">
                              <button
                                onClick={() => handleApproveUser(user._id)}
                                className="btn-success text-sm"
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td className="table-cell font-medium text-gray-900">{user.name}</td>
                          <td className="table-cell text-gray-600">{user.email}</td>
                          <td className="table-cell text-gray-600">{user.accountNumber}</td>
                          <td className="table-cell text-gray-600">{formatCurrency(user.balance)}</td>
                          <td className="table-cell">
                            <span className="badge badge-success">Active</span>
                          </td>
                        </tr>
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
                        <th className="table-cell font-medium text-gray-900">Narration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td className="table-cell font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="table-cell text-gray-600">{transaction.senderAccount}</td>
                          <td className="table-cell text-gray-600">{transaction.receiverAccount}</td>
                          <td className="table-cell">
                            <span className={`badge ${transaction.type === 'internal' ? 'badge-info' : 'badge-warning'}`}>
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
                            {transaction.narration || 'No description'}
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
        </main>
      </div>
    </div>
  );
}