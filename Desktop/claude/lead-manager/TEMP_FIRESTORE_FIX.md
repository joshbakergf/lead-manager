# 🚨 Immediate Firestore Rules Fix

## The Problem
The Firestore security rules are blocking authentication. We need to temporarily set open rules to allow sign-in.

## 🔧 Manual Fix (Do This Now!)

### Option 1: Firebase Console (Recommended)
1. **Go to**: https://console.firebase.google.com/project/interactive-call-script/firestore/rules
2. **Replace all rules with**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. **Click**: "Publish" 
4. **Wait**: 1-2 minutes for rules to propagate

### Option 2: Google Cloud Console
1. **Go to**: https://console.cloud.google.com/firestore/databases/rules?project=interactive-call-script
2. **Edit** the rules to allow authenticated access
3. **Save** and wait for propagation

## 🧪 Test After Rules Update

1. **Go to**: https://lead-manager-388701133207.us-central1.run.app
2. **Open**: Browser dev tools (F12) → Console
3. **Click**: "Sign in with Google"
4. **Look for**: Success messages instead of permission errors

## 🔒 Secure Rules (Apply Later)

After authentication works, we can apply proper role-based rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isGoForthUser() {
      return request.auth != null && 
             request.auth.token.email.matches('.*@go-forth[.]com$');
    }
    
    match /users/{userId} {
      allow read: if isGoForthUser();
      allow create: if isGoForthUser() && request.auth.uid == userId;
      allow update: if isGoForthUser() && request.auth.uid == userId;
    }
    
    match /roles/{roleId} {
      allow read: if isGoForthUser();
      allow create: if isGoForthUser();
    }
    
    match /{document=**} {
      allow read, write: if isGoForthUser();
    }
  }
}
```

## ✅ Expected Result

After updating the rules:
- ✅ Google sign-in should work without permission errors
- ✅ User profile appears in top-right corner  
- ✅ Can create/save scripts to Firestore
- ✅ Real-time collaboration enabled

**The rules update is the critical missing piece!** 🎯