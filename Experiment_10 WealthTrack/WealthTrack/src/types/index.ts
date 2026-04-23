export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  date: any; // Firestore Timestamp
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  currency: string;
  createdAt: any;
  updatedAt: any;
}
