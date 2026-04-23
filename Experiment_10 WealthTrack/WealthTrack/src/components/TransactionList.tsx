import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';
import { Trash2, TrendingDown, TrendingUp, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const TransactionList: React.FC = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(docs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Area you sure you want to delete this transaction?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error: any) {
      handleFirestoreError(error, 'delete', `transactions/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Calendar size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No transactions yet</h3>
        <p className="text-gray-500 max-w-xs mx-auto">Start by adding your first transaction using the button above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Recent Activity</h3>
      <div className="space-y-3">
        <AnimatePresence mode='popLayout'>
          {transactions.map((t) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={t.id}
              className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{t.description || t.category}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Tag size={12} /> {t.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} /> {format(t.date.toDate(), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-mono font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, profile?.currency)}
                </span>
                <button
                  onClick={() => t.id && handleDelete(t.id)}
                  className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
