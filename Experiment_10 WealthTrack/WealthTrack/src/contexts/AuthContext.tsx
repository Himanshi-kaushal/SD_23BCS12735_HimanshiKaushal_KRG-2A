import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync/Fetch profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            currency: 'INR',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          const existingProfile = userSnap.data() as UserProfile;
          
          // Auto-migrate USD users to INR (one-time migration)
          if (existingProfile.currency === 'USD') {
            const updatedProfile = {
              ...existingProfile,
              currency: 'INR',
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, updatedProfile, { merge: true });
            setProfile(updatedProfile);
          } else {
            // Update display name if Firebase auth has a newer one and profile shows "User"
            if (user.displayName && 
                user.displayName !== existingProfile.displayName && 
                existingProfile.displayName === 'User') {
              const updatedProfile = {
                ...existingProfile,
                displayName: user.displayName,
                updatedAt: serverTimestamp(),
              };
              await setDoc(userRef, updatedProfile, { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(existingProfile);
            }
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
