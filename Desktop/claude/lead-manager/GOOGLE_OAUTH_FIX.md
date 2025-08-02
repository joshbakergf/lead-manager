# 🔧 Fix Google Sign-In Error

## The Issue
"Google sign-in failed. Please try again." - This happens when Google OAuth isn't configured for your production domain.

## 🎯 Quick Fix (Do This First!)

### 1. Update Google Cloud Console OAuth Settings

1. **Go to**: https://console.cloud.google.com/apis/credentials?project=interactive-call-script
2. **Find**: OAuth 2.0 Client ID `388701133207-5paj2p5afka0k8nu3uj4av69t930tda9`
3. **Click**: Edit (pencil icon)

### 2. Add Production URLs

Add these EXACT URLs to both sections:

**Authorized JavaScript origins:**
```
https://lead-manager-388701133207.us-central1.run.app
http://localhost:5174
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://lead-manager-388701133207.us-central1.run.app
http://localhost:5174
http://localhost:5173
```

### 3. Save Changes
- Click **SAVE** at the bottom
- Wait 5 minutes for changes to propagate

## 🐛 Debugging Steps

### 1. Check Browser Console
1. Open: https://lead-manager-388701133207.us-central1.run.app
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Try signing in
5. Look for these messages:

```
Initializing Google Auth with client ID: 388701...
Environment variables: {
  VITE_GOOGLE_CLIENT_ID: "388701...",
  VITE_ALLOWED_DOMAIN: "go-forth.com"
}
Google prompt notification: {...}
OAuth2 config: {...}
```

### 2. Common Error Messages

| Error | Meaning | Fix |
|-------|---------|-----|
| `redirect_uri_mismatch` | Production URL not in OAuth config | Add URL to Google Console |
| `invalid_client` | Wrong client ID | Check VITE_GOOGLE_CLIENT_ID |
| `popup_closed_by_user` | User cancelled | Try again |
| `access_blocked` | OAuth not configured | Enable Google+ API |

### 3. OAuth Consent Screen Check

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=interactive-call-script
2. Ensure:
   - **Publishing status**: Testing or Production
   - **User type**: Internal (for Workspace) or External
   - **Test users**: Your email if in Testing mode

## 🔍 What I've Added

The latest deployment includes:
- ✅ Enhanced error logging
- ✅ Environment variable debugging
- ✅ OAuth fallback mechanisms
- ✅ Domain validation logging

## 📝 Manual Test

Try this in browser console:
```javascript
// Check if environment variables loaded
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('Domain:', import.meta.env.VITE_ALLOWED_DOMAIN);

// Check if Google loaded
console.log('Google loaded:', !!window.google);
```

## 🚨 If Still Not Working

### Option 1: Temporary Bypass (Testing Only)
In browser console:
```javascript
localStorage.setItem('currentUserId', 'test-user-123');
// Then refresh page
```

### Option 2: Check Firestore Rules
Ensure Firestore allows authentication:
1. Go to: https://console.cloud.google.com/firestore/rules?project=interactive-call-script
2. Rules should allow `@go-forth.com` users

### Option 3: API Key Restrictions
1. Go to: https://console.cloud.google.com/apis/credentials?project=interactive-call-script
2. Find API key for Firebase
3. Ensure no IP/referrer restrictions or add your domain

## ✅ Success Indicators

When working correctly, you'll see:
1. Google sign-in prompt appears
2. After sign-in, redirects to app
3. User profile shows in top-right
4. Console shows: "Successfully processed Google user"

## 🆘 Still Need Help?

Check deployment status:
```bash
gcloud run services describe lead-manager --region=us-central1 --project=interactive-call-script
```

The most common fix is simply adding the production URL to Google OAuth settings!