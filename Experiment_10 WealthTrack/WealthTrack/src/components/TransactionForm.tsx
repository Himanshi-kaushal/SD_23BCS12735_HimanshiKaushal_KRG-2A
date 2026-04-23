import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(256, 'Too long'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Date is required'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const CATEGORIES = {
  expense: ['Food', 'Rent', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Other'],
  income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
};

export const TransactionForm: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: ''
    }
  });

  const type = watch('type');

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        userId: user.uid,
        amount: Number(data.amount),
        date: new Date(data.date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      reset();
      onClose();
    } catch (error: any) {
      handleFirestoreError(error, 'create', 'transactions');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => reset({ ...watch(), type: t })}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all capitalize",
                      type === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-lg"
                    placeholder="0.00"
                  />
                  {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES[type].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <input
                    type="text"
                    {...register('description')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="What was this for?"
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={20} />
                    <span>Add {type}</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Internal cn helper if not accessible
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
