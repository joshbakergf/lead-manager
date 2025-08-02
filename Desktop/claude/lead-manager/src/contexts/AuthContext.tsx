import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, Permission, SYSTEM_MODULES } from '../types';
import { userService, roleService, initializeDefaultRoles } from '../lib/firestore';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginAsTestUser: () => Promise<void>;
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

  // Initialize default roles in Firestore if needed
  useEffect(() => {
    const initRoles = async () => {
      try {
        await initializeDefaultRoles(DEFAULT_ROLES);
        console.log('Default roles initialized in Firestore');
      } catch (error) {
        console.error('Failed to initialize default roles:', error);
      }
    };
    
    initRoles();
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('✅ Redirect sign-in successful:', {
            email: result.user.email,
            uid: result.user.uid,
            displayName: result.user.displayName
          });
          // The onAuthStateChanged will handle the rest
        } else {
          console.log('No redirect result found');
        }
      } catch (error: any) {
        console.error('❌ Redirect result error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        // Don't throw here, just log the error
      }
    };
    
    checkRedirectResult();
    
    // Check for test auth state first
    const testAuthState = localStorage.getItem('testAuthState');
    if (testAuthState) {
      try {
        const parsed = JSON.parse(testAuthState);
        setAuthState({
          ...parsed,
          isLoading: false
        });
        console.log('Restored test auth state');
        return;
      } catch (error) {
        console.error('Failed to parse test auth state:', error);
        localStorage.removeItem('testAuthState');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 Auth state changed, user:', firebaseUser ? {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified
      } : 'null');
      
      if (firebaseUser) {
        console.log('✅ Firebase user authenticated:', firebaseUser.email);
        
        // Check if user has go-forth.com domain
        if (!firebaseUser.email?.endsWith('@go-forth.com')) {
          console.error('❌ User not from go-forth.com domain:', firebaseUser.email);
          await firebaseSignOut(auth);
          setAuthState({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }
        
        console.log('✅ Domain check passed for:', firebaseUser.email);

        try {
          console.log('🔧 Converting Firebase user to app user...');
          // Convert Firebase user to our User type
          const userId = firebaseUser.uid;
          const email = firebaseUser.email!;
          const displayName = firebaseUser.displayName || '';
          const [firstName, lastName] = displayName.split(' ');

          const roleId = determineUserRole(email);
          console.log('👤 Determined role for', email, ':', roleId);

          const userData: User = {
            id: userId,
            email,
            username: email.split('@')[0],
            firstName: firstName || 'User',
            lastName: lastName || '',
            roleId,
            isActive: true,
            avatar: firebaseUser.photoURL,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          console.log('👤 Created user object:', {
            email: userData.email,
            role: userData.roleId,
            name: `${userData.firstName} ${userData.lastName}`
          });

          // Create or update user in Firestore
          try {
            await userService.createUser(userId, userData);
            console.log('✅ User saved to Firestore:', userData.email);
          } catch (error) {
            console.warn('⚠️ Failed to save user to Firestore:', error);
            // Continue with authentication even if Firestore save fails
          }

          // Get user's role from Firestore
          let userRole: UserRole | null = null;
          try {
            console.log('🔍 Getting role:', userData.roleId);
            userRole = await roleService.getRole(userData.roleId);
            if (!userRole) {
              console.log('⚠️ Role not found in Firestore, using default');
              // Fallback to default role if not found in Firestore
              userRole = DEFAULT_ROLES.find(r => r.id === userData.roleId) || null;
            }
            console.log('✅ Role found:', userRole?.name);
          } catch (error) {
            console.warn('⚠️ Failed to get role from Firestore, using default:', error);
            userRole = DEFAULT_ROLES.find(r => r.id === userData.roleId) || null;
          }

          console.log('🎯 Setting auth state with:', {
            user: userData.email,
            role: userRole?.name,
            isAuthenticated: true
          });

          setAuthState({
            user: userData,
            role: userRole,
            isAuthenticated: true,
            isLoading: false
          });

          console.log('✅ User authenticated successfully:', userData.email);
        } catch (error) {
          console.error('❌ Error processing authenticated user:', error);
          setAuthState({
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        console.log('❌ No Firebase user authenticated - setting state to unauthenticated');
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
        projectId: auth.app.options.projectId,
        authDomain: auth.app.options.authDomain,
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...'
      });
      
      // Clear any existing provider configuration
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'go-forth.com',
        prompt: 'select_account'
      });

      console.log('Attempting sign-in with popup...');
      
      // Sign in with Firebase Auth
      const result = await signInWithPopup(auth, provider);
      console.log('Firebase sign-in successful:', {
        email: result.user.email,
        uid: result.user.uid,
        displayName: result.user.displayName
      });
      
      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error('Firebase Google sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        customData: error.customData
      });
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        console.log('Popup blocked, trying redirect method...');
        // Try redirect method as fallback
        return await loginWithGoogleRedirect();
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for OAuth. Please contact your administrator.');
      } else if (error.code === 'auth/internal-error') {
        // More specific error for internal-error
        console.error('Firebase internal error - this usually indicates a configuration issue');
        console.log('Trying redirect method as fallback...');
        // Try redirect method as fallback for internal errors
        return await loginWithGoogleRedirect();
      } else if (error.message.includes('go-forth.com')) {
        throw new Error('Only Go-Forth team members can access this application. Please use your @go-forth.com email address.');
      } else {
        console.log('Popup method failed, trying redirect as fallback...');
        // Try redirect method as fallback
        return await loginWithGoogleRedirect();
      }
    }
  };

  const loginWithGoogleRedirect = async () => {
    try {
      console.log('Starting Firebase Google sign-in with redirect...');
      
      // Use the imported GoogleAuthProvider and configure it
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'go-forth.com',
        prompt: 'select_account'
      });

      console.log('Initiating redirect...');
      await signInWithRedirect(auth, provider);
      // The page will redirect and onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error('Firebase Google redirect sign-in error:', error);
      throw new Error(`Google sign-in failed: ${error.code} - ${error.message}`);
    }
  };

  const loginAsTestUser = async () => {
    try {
      console.log('Logging in as test user...');
      
      // Create a test user with admin privileges
      const testUser: User = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'admin', // Give admin role for full access
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get admin role
      const adminRole = DEFAULT_ROLES.find(r => r.id === 'admin');
      
      // Set auth state without Firebase
      setAuthState({
        user: testUser,
        role: adminRole || null,
        isAuthenticated: true,
        isLoading: false
      });

      // Save to localStorage for persistence
      localStorage.setItem('testAuthState', JSON.stringify({
        user: testUser,
        role: adminRole,
        isAuthenticated: true
      }));

      console.log('Test user logged in successfully');
    } catch (error) {
      console.error('Test login error:', error);
      throw new Error('Failed to login as test user');
    }
  };

  const logout = async () => {
    try {
      // Clear test auth state if exists
      localStorage.removeItem('testAuthState');
      
      console.log('Signing out from Firebase...');
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Firebase sign out failed:', error);
      // Clear auth state even if Firebase fails
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
        loginWithGoogleRedirect,
        loginAsTestUser,
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