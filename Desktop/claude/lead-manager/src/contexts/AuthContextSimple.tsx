import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, Permission, SYSTEM_MODULES } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  hasPermission: (moduleId: string, permission: Permission) => boolean;
  hasModuleAccess: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple default roles
const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    isSystem: true,
    modulePermissions: SYSTEM_MODULES.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      permissions: ['create', 'read', 'update', 'delete', 'publish', 'export', 'manage'] as Permission[]
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user:', firebaseUser.email);
        
        if (!firebaseUser.email?.endsWith('@go-forth.com')) {
          console.error('User not from go-forth.com domain');
          await firebaseSignOut(auth);
          setAuthState({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          username: firebaseUser.email!.split('@')[0],
          firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ')[1] || '',
          roleId: 'admin', // Everyone is admin for now
          isActive: true,
          avatar: firebaseUser.photoURL,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setAuthState({
          user: userData,
          role: DEFAULT_ROLES[0], // Everyone gets admin role
          isAuthenticated: true,
          isLoading: false
        });

        console.log('User authenticated:', userData.email);
      } else {
        setAuthState({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result.user.email);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Sign out failed:', error);
    }
  };

  const hasPermission = (moduleId: string, permission: Permission): boolean => {
    return true; // Everyone has all permissions for now
  };

  const hasModuleAccess = (moduleId: string): boolean => {
    return true; // Everyone has module access for now
  };

  return (
    <AuthContext.Provider 
      value={{
        ...authState,
        loginWithGoogle,
        logout,
        hasPermission,
        hasModuleAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};