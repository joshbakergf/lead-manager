# 🔍 Google Sign-In Debugging Guide

## Current Status
- ✅ Application deployed: https://lead-manager-388701133207.us-central1.run.app
- ✅ Environment variables configured in production build
- ⚠️ Google OAuth configuration needs to be updated

## Most Likely Issue: OAuth Client Configuration

The Google sign-in failure is most likely due to the OAuth client not being configured for the production domain.

### 🔧 Required Fix: Update Google Cloud Console

1. **Go to Google Cloud Console**:
   - URL: https://console.cloud.google.com/apis/credentials
   - Project: `interactive-call-script`

2. **Find Your OAuth 2.0 Client**:
   - Client ID: `388701133207-5paj2p5afka0k8nu3uj4av69t930tda9`
   - Click the pencil/edit icon

3. **Add Production Domain**:
   
   **Authorized JavaScript origins** (add both):
   ```
   https://lead-manager-388701133207.us-central1.run.app
   http://localhost:5174
   ```
   
   **Authorized redirect URIs** (add both):
   ```
   https://lead-manager-388701133207.us-central1.run.app
   http://localhost:5174
   ```

4. **Save Changes**

## 🐛 Debug Steps

### Step 1: Check Browser Console
1. Go to https://lead-manager-388701133207.us-central1.run.app
2. Open browser developer tools (F12)
3. Go to Console tab
4. Try Google sign-in
5. Look for these debug messages:

```
Environment variables: {
  VITE_GOOGLE_CLIENT_ID: "388701133207-5paj2p5afka0k8nu3uj4av69t930tda9.apps.googleusercontent.com",
  VITE_ALLOWED_DOMAIN: "go-forth.com",
  ...
}
```

### Step 2: Common Error Messages

| Error Message | Solution |
|---------------|----------|
| "redirect_uri_mismatch" | Add production URL to OAuth config |
| "unauthorized_client" | Check client ID in Google Cloud Console |
| "access_blocked" | Enable Google+ API or update OAuth consent screen |
| "popup_closed_by_user" | User cancelled - not an error |

### Step 3: OAuth Consent Screen
If you see "This app isn't verified" or similar:

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Ensure these settings:
   - **User Type**: Internal (for G Suite) or External
   - **Authorized domains**: Add `go-forth.com`
   - **Scopes**: email, profile, openid

## 🧪 Testing Steps

### Test 1: Environment Variables
Check if env vars are loaded correctly:
```javascript
// Should log the correct client ID and domain
console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('VITE_ALLOWED_DOMAIN:', import.meta.env.VITE_ALLOWED_DOMAIN);
```

### Test 2: Google Services Loading
```javascript
// Should not be undefined
console.log('Google services available:', !!window.google?.accounts?.id);
```

### Test 3: Domain Restriction
Try signing in with:
- ✅ A `@go-forth.com` email (should work)
- ❌ A `@gmail.com` email (should show domain error)

## 🔄 Fallback Options

### Option 1: Use Development Login
For immediate testing, use the fallback authentication:
- Email: `admin@go-forth.com`
- Password: Any password

### Option 2: Temporary Domain Fix
If OAuth config can't be updated immediately, temporarily modify the domain check:

```javascript
// In googleAuth.ts, temporarily change:
if (payload.hd !== allowedDomain) {
  // Comment out for testing:
  // reject(new Error(`Only ${allowedDomain} email addresses are allowed`));
  console.warn('Domain check bypassed for testing');
}
```

## 📞 Next Steps

1. **Immediate**: Update Google OAuth configuration (steps above)
2. **Test**: Try Google sign-in after OAuth update
3. **Verify**: Check console logs for debugging info
4. **Report**: Let me know what specific errors you see

The most critical step is updating the OAuth client configuration in Google Cloud Console to include the production domain.