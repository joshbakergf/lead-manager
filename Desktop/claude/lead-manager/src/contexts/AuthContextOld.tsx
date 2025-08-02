import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState, Permission, SYSTEM_MODULES } from '../types';
import { userService, roleService, initializeDefaultRoles } from '../lib/firestore';
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
  // Admin emails - customize this list as needed
  const adminEmails = [
    'josh.baker@go-forth.com',
    'admin@go-forth.com'
  ];
  
  // Manager emails - customize this list as needed  
  const managerEmails = [
    'manager@go-forth.com',
    'sales.manager@go-forth.com'
  ];
  
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin';
  } else if (managerEmails.includes(email.toLowerCase())) {
    return 'manager';
  } else {
    return 'agent'; // Default role for all other go-forth.com users
  }
};

// Convert Google user to our User type
const convertGoogleUserToUser = (googleUser: GoogleUser): User => {
  return {
    id: googleUser.id,
    email: googleUser.email,
    username: googleUser.email.split('@')[0],
    firstName: googleUser.given_name,
    lastName: googleUser.family_name,
    roleId: determineUserRole(googleUser.email),
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    avatar: googleUser.picture
  };
};

// No default users needed - all users created via Google OAuth

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Initialize auth and check for existing session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize default roles in Firestore if needed
        await initializeDefaultRoles(DEFAULT_ROLES);
      } catch (error) {
        console.warn('Failed to initialize default roles:', error);
      }
    };

    // Listen to Firebase Auth state changes
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

          const userData = {
            id: userId,
            email,
            username: email.split('@')[0],
            firstName: firstName || 'User',
            lastName: lastName || '',
            roleId: determineUserRole(email),
            isActive: true,
            avatar: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Check if user exists in Firestore
          let firestoreUser = await userService.getUser(userId);
          
          if (!firestoreUser) {
            // Create new user in Firestore
            await userService.createUser(userId, userData);
            firestoreUser = userData;
          } else {
            // Update last login
            await userService.updateUser(userId, {
              lastLogin: new Date().toISOString(),
              avatar: firebaseUser.photoURL
            });
          }
          
          // Fetch user's role
          const roles = await roleService.getRoles();
          const userRole = roles.find(r => r.id === firestoreUser.roleId);

          setAuthState({
            user: firestoreUser,
            role: userRole || null,
            isAuthenticated: true,
            isLoading: false
          });
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
        setAuthState({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    });

    initializeAuth();

    return unsubscribe;
  }, []);


  const loginWithGoogle = async () => {
    try {
      console.log('Starting Firebase Google sign-in...');
      
      // Configure Google provider with domain restriction
      googleProvider.setCustomParameters({
        hd: 'go-forth.com', // Restrict to go-forth.com domain
        prompt: 'select_account'
      });

      // Sign in with Firebase Auth
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Firebase sign-in successful:', result.user.email);
      
      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error('Firebase Google sign-in error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked. Please enable popups and try again.');
      } else if (error.message.includes('go-forth.com')) {
        throw new Error('Only Go-Forth team members can access this application. Please use your @go-forth.com email address.');
      } else {
        throw new Error(`Google sign-in failed: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      console.log('Signing out from Firebase...');
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle updating the state
    } catch (error) {
      console.warn('Firebase sign out failed:', error);
      // Manually update state if sign out fails
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