import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Transaction } from '../types';
import { Navbar } from './Navbar';
import { SummaryCards } from './SummaryCards';
import { SpendingChart } from './SpendingChart';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { Profile } from './Profile';
import { Plus, BarChart3, List, User } from 'lucide-react';
import { motion } from 'motion/react';

type TabType = 'overview' | 'transactions' | 'profile';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
    });

    return () => unsubscribe();
  }, [user]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'transactions' as TabType, label: 'Transactions', icon: List },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <SpendingChart transactions={transactions} />
            <TransactionList />
          </div>
        );
      case 'transactions':
        return <TransactionList />;
      case 'profile':
        return <Profile />;
      default:
        return null;
    }
  };

  const showAddButton = activeTab !== 'profile';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 font-medium">Welcome back! Here's your financial overview.</p>
          </div>
          {showAddButton && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFormOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all self-start"
            >
              <Plus size={20} />
              <span>Add Transaction</span>
            </motion.button>
          )}
        </header>

        {activeTab !== 'profile' && <SummaryCards transactions={transactions} />}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </main>

      <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};
