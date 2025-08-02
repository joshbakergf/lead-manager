# Google Authentication Setup

This guide explains how to set up Google OAuth for the Lead Manager application to restrict access to @go-forth.com users only.

## Prerequisites

1. Google Cloud Console access
2. Domain admin privileges for go-forth.com (for G Suite/Workspace configuration)

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen:
   - Application type: Web application
   - Application name: "Go-Forth Lead Manager"
   - Authorized domains: Add your domain (e.g., `go-forth.com`)
   - Scopes: Add `email`, `profile`, and `openid`

## Step 2: Configure OAuth Client

1. Set Application type to "Web application"
2. Add your application URLs to "Authorized JavaScript origins":
   - `http://localhost:5173` (for development)
   - `https://your-production-domain.com` (for production)
3. Add redirect URIs to "Authorized redirect URIs":
   - `http://localhost:5173` (for development)
   - `https://your-production-domain.com` (for production)

## Step 3: Configure Environment Variables

The `.env.local` file has been configured with your Google OAuth credentials:

```env
# Google OAuth Configuration (replace with your actual values)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_ALLOWED_DOMAIN=go-forth.com
```

**Important**: These credentials should be configured in your Google Cloud Console to allow the application domain.

## Step 4: Domain Restriction Setup

The application is configured to only allow users with `@go-forth.com` email addresses. This is enforced in two ways:

1. **OAuth Configuration**: The `hosted_domain` parameter restricts sign-in to your G Suite domain
2. **Token Verification**: The application verifies the `hd` (hosted domain) claim in the JWT token

## Step 5: User Role Assignment

Users are automatically assigned roles based on their email address:

- **Administrators**: Listed in `adminEmails` array in `AuthContext.tsx`
  - `josh.baker@go-forth.com`
  - `admin@go-forth.com`

- **Managers**: Listed in `managerEmails` array in `AuthContext.tsx`
  - `manager@go-forth.com`
  - `sales.manager@go-forth.com`

- **Agents**: All other `@go-forth.com` users (default role)

To modify user roles, update the email arrays in `/src/contexts/AuthContext.tsx`.

## Step 6: Testing

1. Start the development server: `npm run dev`
2. Navigate to the application
3. Click "Sign in with Google"
4. Verify that only @go-forth.com users can access the application
5. Check that users are assigned the correct roles based on their email

## Security Notes

- Never commit your actual Google OAuth credentials to version control
- The `.env.local` file is already included in `.gitignore`
- In production, set environment variables through your hosting platform
- Consider implementing additional security measures like IP restrictions if needed

## Troubleshooting

### Common Issues:

1. **"Only go-forth.com email addresses are allowed"**
   - Ensure the user is signing in with a @go-forth.com email
   - Check that `VITE_ALLOWED_DOMAIN` is set correctly

2. **"Google sign-in failed"**
   - Verify Google OAuth credentials are correct
   - Check that the domain is properly configured in Google Cloud Console
   - Ensure JavaScript origins and redirect URIs are correctly set

3. **"Invalid Google token"**
   - Check that the Google Client ID matches your OAuth application
   - Verify the token hasn't expired

### Google-Only Authentication:

The application now uses **Google-only authentication**. There is no fallback username/password login. All users must sign in with their `@go-forth.com` Google account.

**Benefits:**
- ✅ Streamlined authentication flow  
- ✅ No password management needed
- ✅ Automatic account creation for new team members
- ✅ Enhanced security with Google's authentication