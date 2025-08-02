import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase';
import { User, UserRole, FormPage, PublishedScript, FormSubmission, WebhookConnection, ZillowConnection } from '../types';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  SCRIPTS: 'scripts',
  PUBLISHED_SCRIPTS: 'publishedScripts',
  LEADS: 'leads',
  WORKFLOWS: 'workflows',
  WEBHOOKS: 'webhooks',
  ZILLOW_CONNECTIONS: 'zillowConnections'
} as const;

// User operations
export const userService = {
  async createUser(userId: string, userData: Omit<User, 'id'>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getAllUsers(): Promise<User[]> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  },

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      callback(users);
    });
  }
};

// Role operations
export const roleService = {
  async createRole(roleData: Omit<UserRole, 'id'>): Promise<string> {
    const rolesRef = collection(db, COLLECTIONS.ROLES);
    const roleRef = doc(rolesRef);
    
    await setDoc(roleRef, {
      ...roleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return roleRef.id;
  },

  async getRoles(): Promise<UserRole[]> {
    const rolesRef = collection(db, COLLECTIONS.ROLES);
    const snapshot = await getDocs(rolesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserRole));
  },

  async updateRole(roleId: string, updates: Partial<UserRole>): Promise<void> {
    const roleRef = doc(db, COLLECTIONS.ROLES, roleId);
    await updateDoc(roleRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  subscribeToRoles(callback: (roles: UserRole[]) => void): () => void {
    const rolesRef = collection(db, COLLECTIONS.ROLES);
    
    return onSnapshot(rolesRef, (snapshot) => {
      const roles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserRole));
      callback(roles);
    });
  }
};

// Script operations
export const scriptService = {
  async createScript(scriptData: {
    name: string;
    pages: FormPage[];
    createdBy: string;
  }): Promise<string> {
    const scriptsRef = collection(db, COLLECTIONS.SCRIPTS);
    const scriptRef = doc(scriptsRef);
    
    await setDoc(scriptRef, {
      ...scriptData,
      isPublished: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return scriptRef.id;
  },

  async updateScript(scriptId: string, updates: {
    name?: string;
    pages?: FormPage[];
    isPublished?: boolean;
  }): Promise<void> {
    const scriptRef = doc(db, COLLECTIONS.SCRIPTS, scriptId);
    await updateDoc(scriptRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getScript(scriptId: string): Promise<any | null> {
    const scriptRef = doc(db, COLLECTIONS.SCRIPTS, scriptId);
    const scriptSnap = await getDoc(scriptRef);
    
    if (scriptSnap.exists()) {
      return { id: scriptSnap.id, ...scriptSnap.data() };
    }
    return null;
  },

  async getAllScripts(): Promise<any[]> {
    const scriptsRef = collection(db, COLLECTIONS.SCRIPTS);
    const q = query(scriptsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async deleteScript(scriptId: string): Promise<void> {
    const scriptRef = doc(db, COLLECTIONS.SCRIPTS, scriptId);
    await deleteDoc(scriptRef);
  },

  subscribeToScripts(callback: (scripts: any[]) => void): () => void {
    const scriptsRef = collection(db, COLLECTIONS.SCRIPTS);
    const q = query(scriptsRef, orderBy('updatedAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const scripts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(scripts);
    });
  }
};

// Lead operations
export const leadService = {
  async createLead(leadData: Omit<FormSubmission, 'id'>): Promise<string> {
    const leadsRef = collection(db, COLLECTIONS.LEADS);
    const leadRef = doc(leadsRef);
    
    await setDoc(leadRef, {
      ...leadData,
      submittedAt: serverTimestamp(),
      timestamp: Date.now()
    });
    
    return leadRef.id;
  },

  async getLeads(filters?: {
    scriptId?: string;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FormSubmission[]> {
    const leadsRef = collection(db, COLLECTIONS.LEADS);
    let q = query(leadsRef, orderBy('submittedAt', 'desc'));
    
    if (filters?.scriptId) {
      q = query(q, where('scriptId', '==', filters.scriptId));
    }
    if (filters?.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FormSubmission));
  },

  async updateLead(leadId: string, updates: Partial<FormSubmission>): Promise<void> {
    const leadRef = doc(db, COLLECTIONS.LEADS, leadId);
    await updateDoc(leadRef, updates);
  },

  subscribeToLeads(callback: (leads: FormSubmission[]) => void): () => void {
    const leadsRef = collection(db, COLLECTIONS.LEADS);
    const q = query(leadsRef, orderBy('submittedAt', 'desc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FormSubmission));
      callback(leads);
    });
  }
};

// Published script operations
export const publishedScriptService = {
  async publishScript(scriptData: Omit<PublishedScript, 'id' | 'publishedAt' | 'accessUrl'>): Promise<string> {
    const publishedRef = collection(db, COLLECTIONS.PUBLISHED_SCRIPTS);
    const scriptRef = doc(publishedRef);
    
    const accessUrl = `/s/${scriptRef.id}`;
    
    await setDoc(scriptRef, {
      ...scriptData,
      publishedAt: serverTimestamp(),
      accessUrl,
      isActive: true
    });
    
    return scriptRef.id;
  },

  async getPublishedScript(scriptId: string): Promise<PublishedScript | null> {
    const scriptRef = doc(db, COLLECTIONS.PUBLISHED_SCRIPTS, scriptId);
    const scriptSnap = await getDoc(scriptRef);
    
    if (scriptSnap.exists()) {
      return { id: scriptSnap.id, ...scriptSnap.data() } as PublishedScript;
    }
    return null;
  },

  async deletePublishedScript(scriptId: string): Promise<void> {
    const scriptRef = doc(db, COLLECTIONS.PUBLISHED_SCRIPTS, scriptId);
    await deleteDoc(scriptRef);
  },

  async getActiveScripts(): Promise<PublishedScript[]> {
    const scriptsRef = collection(db, COLLECTIONS.PUBLISHED_SCRIPTS);
    // Simplified query - get all scripts then filter in code to avoid index requirements
    const q = query(scriptsRef, orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    // Filter active scripts in code instead of database query
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PublishedScript))
      .filter(script => script.isActive === true);
  },

  subscribeToActiveScripts(callback: (scripts: PublishedScript[]) => void): () => void {
    const scriptsRef = collection(db, COLLECTIONS.PUBLISHED_SCRIPTS);
    // Simplified query to avoid index requirements
    const q = query(scriptsRef, orderBy('publishedAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      // Filter active scripts in code instead of database query
      const scripts = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PublishedScript))
        .filter(script => script.isActive === true);
      callback(scripts);
    });
  }
};

// Webhook operations
export const webhookService = {
  async createWebhook(webhookData: Omit<WebhookConnection, 'id' | 'createdAt'>): Promise<string> {
    const webhooksRef = collection(db, COLLECTIONS.WEBHOOKS);
    const webhookRef = doc(webhooksRef);
    
    await setDoc(webhookRef, {
      ...webhookData,
      createdAt: serverTimestamp()
    });
    
    return webhookRef.id;
  },

  async getWebhooks(): Promise<WebhookConnection[]> {
    const webhooksRef = collection(db, COLLECTIONS.WEBHOOKS);
    const snapshot = await getDocs(webhooksRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WebhookConnection));
  },

  async updateWebhook(webhookId: string, updates: Partial<WebhookConnection>): Promise<void> {
    const webhookRef = doc(db, COLLECTIONS.WEBHOOKS, webhookId);
    await updateDoc(webhookRef, updates);
  },

  async deleteWebhook(webhookId: string): Promise<void> {
    const webhookRef = doc(db, COLLECTIONS.WEBHOOKS, webhookId);
    await deleteDoc(webhookRef);
  }
};

// Workflow operations
export const workflowService = {
  async saveWorkflow(scriptId: string, workflowData: any): Promise<void> {
    const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, scriptId);
    await setDoc(workflowRef, {
      ...workflowData,
      updatedAt: serverTimestamp()
    });
  },

  async getWorkflow(scriptId: string): Promise<any | null> {
    const workflowRef = doc(db, COLLECTIONS.WORKFLOWS, scriptId);
    const workflowSnap = await getDoc(workflowRef);
    
    if (workflowSnap.exists()) {
      return workflowSnap.data();
    }
    return null;
  }
};

// Initialize default roles if they don't exist
export const initializeDefaultRoles = async (roles: UserRole[]): Promise<void> => {
  const existingRoles = await roleService.getRoles();
  
  if (existingRoles.length === 0) {
    for (const role of roles) {
      await roleService.createRole(role);
    }
  }
};