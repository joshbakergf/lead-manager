# 🗄️ Database & Backend Setup Guide

## Current State
The application currently uses **browser localStorage** which means:
- ❌ Data is only stored locally in each browser
- ❌ No sharing between users
- ❌ Data lost if browser storage is cleared
- ❌ No real-time collaboration

## Architecture Options for Google Cloud

### Option 1: Serverless with Firestore (Recommended) 🌟
**Best for: Quick setup, real-time updates, minimal maintenance**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React App  │ ──► │  Firestore   │ ◄─► │Google Auth  │
│ (Cloud Run) │     │  (NoSQL DB)  │     │   (OAuth)   │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Pros:**
- ✅ Real-time data sync built-in
- ✅ No server code needed (direct from React)
- ✅ Automatic scaling
- ✅ Free tier: 1GB storage, 50K reads/day
- ✅ Built-in security rules

**Setup Steps:**
1. Enable Firestore in Google Cloud Console
2. Install Firebase SDK
3. Configure security rules
4. Update React components to use Firestore

### Option 2: API Backend with Cloud SQL
**Best for: Complex queries, traditional SQL, existing SQL knowledge**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React App  │ ──► │  Node.js API │ ──► │  Cloud SQL  │
│ (Cloud Run) │     │ (Cloud Run)  │     │ (PostgreSQL)│
└─────────────┘     └──────────────┘     └─────────────┘
```

**Pros:**
- ✅ Full SQL capabilities
- ✅ Complex relationships and queries
- ✅ Better for reporting/analytics
- ✅ Standard SQL knowledge applies

**Cons:**
- ❌ Need to build API layer
- ❌ More complex setup
- ❌ Higher cost (~$10/month minimum)

### Option 3: Hybrid with Cloud Functions
**Best for: Gradual migration, specific server-side logic**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React App  │ ──► │Cloud Function│ ──► │  Firestore  │
│ (Cloud Run) │     │  (Triggers)  │     │   or SQL    │
└─────────────┘     └──────────────┘     └─────────────┘
```

## 🚀 Recommended: Firestore Implementation

### Step 1: Enable Firestore
```bash
# Enable Firestore API
gcloud services enable firestore.googleapis.com --project=interactive-call-script

# Create Firestore database (choose mode: Native)
gcloud firestore databases create --location=us-central1 --project=interactive-call-script
```

### Step 2: Install Firebase SDK
```bash
npm install firebase
```

### Step 3: Database Structure
```javascript
// Firestore Collections Structure
firestore/
├── users/
│   └── {userId}/
│       ├── email
│       ├── name
│       ├── role
│       └── createdAt
├── scripts/
│   └── {scriptId}/
│       ├── name
│       ├── pages[]
│       ├── createdBy
│       ├── updatedAt
│       └── isPublished
├── leads/
│   └── {leadId}/
│       ├── scriptId
│       ├── data{}
│       ├── submittedAt
│       └── assignedTo
├── workflows/
│   └── {workflowId}/
│       ├── scriptId
│       ├── nodes[]
│       ├── edges[]
│       └── logic{}
└── webhooks/
    └── {webhookId}/
        ├── name
        ├── url
        ├── auth{}
        └── mappings[]
```

### Step 4: Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access if authenticated with go-forth.com
    function isGoForthUser() {
      return request.auth != null && 
             request.auth.token.email.matches('.*@go-forth[.]com$');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isGoForthUser();
      allow write: if isGoForthUser() && request.auth.uid == userId;
    }
    
    // Scripts - all authenticated users can read, role-based write
    match /scripts/{scriptId} {
      allow read: if isGoForthUser();
      allow create: if isGoForthUser();
      allow update: if isGoForthUser() && 
        (resource.data.createdBy == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if isGoForthUser() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Leads - read based on role, create by agents
    match /leads/{leadId} {
      allow read: if isGoForthUser();
      allow create: if isGoForthUser();
    }
  }
}
```

### Step 5: Initialize Firebase in React
```javascript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "interactive-call-script.firebaseapp.com",
  projectId: "interactive-call-script",
  storageBucket: "interactive-call-script.appspot.com",
  messagingSenderId: "388701133207",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Step 6: Update React Components
```javascript
// Example: Save a script to Firestore
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const saveScript = async (script) => {
  const scriptRef = doc(collection(db, 'scripts'));
  await setDoc(scriptRef, {
    ...script,
    createdBy: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
```

## 💰 Cost Estimates

### Firestore (Recommended)
- **Free Tier**: 
  - 1GB storage
  - 50K reads/day
  - 20K writes/day
- **Estimated Cost**: $0-10/month for small team

### Cloud SQL
- **Minimum**: ~$10/month (db-f1-micro)
- **Recommended**: ~$50/month (db-n1-standard-1)
- **Plus**: Cloud Run costs for API

### Cloud Functions
- **Free Tier**: 2M invocations/month
- **Estimated**: $0-5/month

## 🎯 Next Steps

1. **Choose Architecture**: I recommend starting with Firestore
2. **Enable Services**: Run the gcloud commands above
3. **Install Dependencies**: Add Firebase SDK
4. **Update Code**: I can help migrate localStorage to Firestore
5. **Deploy**: Update deployment to include Firebase config

## 🔧 Quick Start Commands

```bash
# Enable required services
gcloud services enable firestore.googleapis.com --project=interactive-call-script
gcloud services enable firebaseapp.com --project=interactive-call-script

# Create Firestore database
gcloud firestore databases create --location=us-central1 --project=interactive-call-script

# Install Firebase
cd /Users/joshbaker/Desktop/claude/lead-manager
npm install firebase
```

Would you like me to implement the Firestore integration? I can start with basic script and lead storage to demonstrate the setup.