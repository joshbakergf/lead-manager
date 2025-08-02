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

// Default roles for initial setup
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
  },
  {
    id: 'manager',
    name: 'Sales Manager',
    description: 'Manage sales scripts and view results',
    isSystem: true,
    modulePermissions: [
      {
        moduleId: 'content',
        moduleName: 'Content Editor',
        permissions: ['create', 'read', 'update', 'delete', 'publish']
      },
      {
        moduleId: 'workflow',
        moduleName: 'Workflow Builder',
        permissions: ['create', 'read', 'update', 'delete']
      },
      {
        moduleId: 'connect',
        moduleName: 'Connections',
        permissions: ['read', 'update']
      },
      {
        moduleId: 'share',
        moduleName: 'Publishing',
        permissions: ['read', 'publish']
      },
      {
        moduleId: 'leads',
        moduleName: 'Lead Management',
        permissions: ['read', 'export']
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agent',
    name: 'Sales Agent',
    description: 'Use published scripts and submit leads',
    isSystem: true,
    modulePermissions: [
      {
        moduleId: 'share',
        moduleName: 'Publishing',
        permissions: ['read']
      },
      {
        moduleId: 'leads',
        moduleName: 'Lead Management',
        permissions: ['create', 'read']
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to determine user role based on email
const determineUserRole = (email: string): string => {
  const adminEmails = [
    'josh.baker@go-forth.com',
    'admin@go-forth.com'
  ];
  
  const managerEmails = [
    'manager@go-forth.com',
    'sales.manager@go-forth.com'
  ];
  
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin';
  } else if (managerEmails.includes(email.toLowerCase())) {
    return 'manager';
  } else {
    return 'agent';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Initialize auth using localStorage temporarily (bypass Firestore)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser);
        
        // Check if user has go-forth.com domain
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

        try {
          // Convert Firebase user to our User type
          const userId = firebaseUser.uid;
          const email = firebaseUser.email!;
          const displayName = firebaseUser.displayName || '';
          const [firstName, lastName] = displayName.split(' ');

          const userData: User = {
            id: userId,
            email,
            username: email.split('@')[0],
            firstName: firstName || 'User',
            lastName: lastName || '',
            roleId: determineUserRole(email),
            isActive: true,
            avatar: firebaseUser.photoURL,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Store in localStorage temporarily (bypass Firestore)
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('userRoles', JSON.stringify(DEFAULT_ROLES));
          
          // Find user's role
          const userRole = DEFAULT_ROLES.find(r => r.id === userData.roleId);

          setAuthState({
            user: userData,
            role: userRole || null,
            isAuthenticated: true,
            isLoading: false
          });

          console.log('User authenticated successfully:', userData);
        } catch (error) {
          console.error('Error processing authenticated user:', error);
          setAuthState({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        console.log('No Firebase user authenticated');
        localStorage.removeItem('currentUser');
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
      console.log('Starting Firebase Google sign-in...');
      console.log('Current domain:', window.location.origin);
      console.log('Firebase config:', {
        apiKey: auth.config.apiKey,
        authDomain: auth.config.authDomain,
        projectId: auth.config.projectId
      });
      
      // Configure Google provider with domain restriction
      googleProvider.setCustomParameters({
        hd: 'go-forth.com',
        prompt: 'select_account'
      });
      
      console.log('Google provider configured, attempting popup...');

      // Sign in with Firebase Auth
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Firebase sign-in successful:', result.user.email);
      
      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error('Firebase Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked. Please enable popups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for OAuth. Please contact your administrator.');
      } else if (error.message.includes('go-forth.com')) {
        throw new Error('Only Go-Forth team members can access this application. Please use your @go-forth.com email address.');
      } else {
        throw new Error(`Google sign-in failed: ${error.code} - ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      console.log('Signing out from Firebase...');
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Firebase sign out failed:', error);
      setAuthState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  const hasPermission = (moduleId: string, permission: Permission): boolean => {
    if (!authState.role) return false;
    
    const modulePerms = authState.role.modulePermissions.find(mp => mp.moduleId === moduleId);
    return modulePerms ? modulePerms.permissions.includes(permission) : false;
  };

  const hasModuleAccess = (moduleId: string): boolean => {
    if (!authState.role) return false;
    
    const modulePerms = authState.role.modulePermissions.find(mp => mp.moduleId === moduleId);
    return modulePerms ? modulePerms.permissions.length > 0 : false;
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