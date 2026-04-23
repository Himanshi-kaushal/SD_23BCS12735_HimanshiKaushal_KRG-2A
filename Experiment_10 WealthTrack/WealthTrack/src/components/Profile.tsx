import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Globe, 
  Shield, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  AlertTriangle,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { 
  updateDoc, 
  doc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  updateProfile, 
  updateEmail, 
  deleteUser, 
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { db, auth, googleProvider } from '../lib/firebase';
import { format } from 'date-fns';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteStep, setDeleteStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [editData, setEditData] = useState({
    displayName: profile?.displayName || '',
    email: user?.email || '',
    currency: profile?.currency || 'INR'
  });

  const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' }
  ];

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
    setLoading(true);
    setError('');

    try {
      // Update Firebase Auth profile
      if (editData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: editData.displayName });
      }

      // Update email if changed
      if (editData.email !== user.email) {
        await updateEmail(user, editData.email);
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editData.displayName,
        email: editData.email,
        currency: editData.currency,
        updatedAt: serverTimestamp()
      });

      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const reauthenticateUser = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if user signed in with Google
      const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
      
      if (isGoogleUser) {
        await reauthenticateWithPopup(user, googleProvider);
      } else {
        // Email/password user
        if (!deletePassword) {
          setError('Please enter your password to confirm account deletion');
          return false;
        }
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }
      return true;
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
      return false;
    }
  };

  const deleteAllUserData = async () => {
    if (!user) return;

    const batch = writeBatch(db);

    try {
      // Delete user profile
      batch.delete(doc(db, 'users', user.uid));

      // Delete all transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete all recurring transactions
      const recurringQuery = query(
        collection(db, 'recurringTransactions'),
        where('userId', '==', user.uid)
      );
      const recurringSnapshot = await getDocs(recurringQuery);
      recurringSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Reauthenticate
      if (deleteStep === 1) {
        const success = await reauthenticateUser();
        if (success) {
          setDeleteStep(2);
        }
        setLoading(false);
        return;
      }

      // Step 2: Delete all data and account
      await deleteAllUserData();
      await deleteUser(user);
      
      // User will be automatically signed out
    } catch (error: any) {
      setError(error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = () => {
    if (!user) return 'Unknown';
    const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
    return googleProvider ? 'Google' : 'Email/Password';
  };

  const isGoogleUser = user?.providerData.some(provider => provider.providerId === 'google.com');

  if (!user || !profile) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <User className="text-indigo-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
              <p className="text-sm text-gray-500">Manage your account and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Edit3 size={16} />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      displayName: profile.displayName,
                      email: user.email || '',
                      currency: profile.currency
                    });
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your display name"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <User className="text-gray-400" size={20} />
                  <span className="text-gray-900">{profile.displayName}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {isEditing && !isGoogleUser ? (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <Mail className="text-gray-400" size={20} />
                  <span className="text-gray-900">{user.email}</span>
                  {isGoogleUser && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Google</span>
                  )}
                </div>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Currency</label>
              {isEditing ? (
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={editData.currency}
                    onChange={(e) => setEditData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <Globe className="text-gray-400" size={20} />
                  <span className="text-gray-900">
                    {currencies.find(c => c.code === profile.currency)?.name || profile.currency}
                  </span>
                </div>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <Shield className="text-gray-400" size={20} />
                <span className="text-gray-900">{getProviderName()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(profile.createdAt?.toDate() || new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(profile.updatedAt?.toDate() || new Date(), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteStep(1);
              setDeletePassword('');
              setError('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
                </div>

                {deleteStep === 1 ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                      <p className="text-red-800 font-medium mb-2">⚠️ This action cannot be undone!</p>
                      <p className="text-red-700 text-sm">
                        Deleting your account will permanently remove:
                      </p>
                      <ul className="text-red-700 text-sm mt-2 space-y-1">
                        <li>• All your transactions</li>
                        <li>• All recurring transactions</li>
                        <li>• Your profile and settings</li>
                        <li>• All associated data</li>
                      </ul>
                    </div>

                    {!isGoogleUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter your password to confirm
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Your password"
                        />
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
                      <p className="text-red-800 font-bold text-lg mb-2">Final Confirmation</p>
                      <p className="text-red-700">
                        Are you absolutely sure you want to delete your account?
                        This will permanently delete all your data.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteStep(1);
                      setDeletePassword('');
                      setError('');
                    }}
                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        {deleteStep === 1 ? 'Confirm' : 'Delete Forever'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};