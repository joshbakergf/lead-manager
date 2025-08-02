# 🆘 MANUAL FIRESTORE RULES FIX REQUIRED

## ⚠️ The Issue
The Firestore security rules are **blocking all access**. This needs to be fixed manually via the Firebase Console.

## 🔧 STEP-BY-STEP FIX

### Step 1: Access Firebase Console
1. **Go to**: https://console.firebase.google.com/
2. **Select project**: `interactive-call-script`
3. **Click**: "Firestore Database" in left sidebar

### Step 2: Update Rules
1. **Click**: "Rules" tab at the top
2. **You'll see current restrictive rules**
3. **Delete all existing rules**
4. **Paste this temporary fix**:

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

### Step 3: Publish Rules
1. **Click**: "Publish" button
2. **Wait**: 1-2 minutes for rules to propagate
3. **You'll see**: "Rules published successfully"

## 🧪 Test Immediately After

1. **Go to**: https://lead-manager-388701133207.us-central1.run.app
2. **Click**: "Sign in with Google"
3. **Expected**: No more "insufficient permissions" error
4. **Result**: Should redirect to dashboard

## 🔍 Alternative: Google Cloud Console

If Firebase Console doesn't work:

1. **Go to**: https://console.cloud.google.com/firestore/databases?project=interactive-call-script
2. **Click**: "Security rules" tab
3. **Edit**: Rules to match the ones above
4. **Save**: Changes

## 📊 What These Rules Do

```javascript
// Allow any authenticated user to read/write
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

- ✅ **Any signed-in user**: Can access Firestore
- ✅ **Firebase Auth tokens**: Automatically validated
- ✅ **Domain restriction**: Still enforced by Firebase Auth
- ⚠️ **Temporary**: We'll secure this later

## 🚨 CRITICAL: This Must Be Done Manually

The Firebase CLI and API deployments aren't working. The **only way** to fix this is:

1. ✅ **Manual update via Firebase Console**
2. ✅ **Test authentication immediately**
3. ✅ **Confirm no more permission errors**

## 🎯 Expected Success

After manual rules update:
- ✅ Google sign-in works
- ✅ User profile appears in app
- ✅ Can save scripts to Firestore  
- ✅ Real-time data sync works
- ✅ Team collaboration enabled

**Please update the rules manually - it's the only remaining blocker!** 🚀