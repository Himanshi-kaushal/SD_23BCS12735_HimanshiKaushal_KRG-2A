import React from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export const SummaryCards: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const { profile } = useAuth();
  
  const stats = React.useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, balance, savingsRate };
  }, [transactions]);

  const cards = [
    {
      title: 'Current Balance',
      value: stats.balance,
      icon: Wallet,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      lightColor: 'bg-indigo-50'
    },
    {
      title: 'Total Income',
      value: stats.totalIncome,
      icon: ArrowUpRight,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      lightColor: 'bg-emerald-50'
    },
    {
      title: 'Total Expenses',
      value: stats.totalExpenses,
      icon: ArrowDownRight,
      color: 'bg-rose-600',
      textColor: 'text-rose-600',
      lightColor: 'bg-rose-50'
    },
    {
      title: 'Savings Rate',
      value: `${stats.savingsRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-amber-600',
      textColor: 'text-amber-600',
      lightColor: 'bg-amber-50',
      isRaw: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={card.title}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
        >
          <div className="flex justify-between items-start">
            <div className={`p-2 rounded-xl ${card.lightColor} ${card.textColor}`}>
              <card.icon size={24} />
            </div>
            {i === 3 && (
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">Efficiency</div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 leading-none">
              {card.isRaw ? card.value : formatCurrency(Number(card.value), profile?.currency)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
