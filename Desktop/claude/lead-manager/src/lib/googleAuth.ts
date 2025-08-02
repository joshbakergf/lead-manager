// Google Identity Services types
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  hd?: string; // Hosted domain (for G Suite accounts)
}

// JWT payload interface
interface GoogleJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  hd?: string;
}

// Decode JWT token (simple base64 decode - for ID tokens only)
function decodeJWT(token: string): GoogleJWTPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }
  
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initializeGoogleAuth(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google auth can only be initialized in browser'));
        return;
      }

      // Load Google Identity Services script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.setupGoogleAuth();
          this.isInitialized = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      } else {
        this.setupGoogleAuth();
        this.isInitialized = true;
        resolve();
      }
    });
  }

  private setupGoogleAuth(): void {
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not available');
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('Initializing Google Auth with client ID:', clientId);

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: () => {}, // Will be overridden in signIn
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initializeGoogleAuth();
    }

    // Debug environment variables
    console.log('Environment variables:', {
      VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      VITE_ALLOWED_DOMAIN: import.meta.env.VITE_ALLOWED_DOMAIN,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services not initialized'));
        return;
      }

      // Override the callback for this sign-in attempt
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: GoogleCredentialResponse) => {
          try {
            console.log('Google credential response received:', response);
            const payload = decodeJWT(response.credential);
            console.log('Decoded JWT payload:', payload);
            
            // Check if user belongs to allowed domain
            const allowedDomain = import.meta.env.VITE_ALLOWED_DOMAIN;
            console.log('Checking domain. User domain:', payload.hd, 'Allowed domain:', allowedDomain);
            
            if (payload.hd !== allowedDomain) {
              reject(new Error(`Only ${allowedDomain} email addresses are allowed. Your domain: ${payload.hd || 'none'}`));
              return;
            }

            const user: GoogleUser = {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              given_name: payload.given_name,
              family_name: payload.family_name,
              picture: payload.picture,
              hd: payload.hd
            };

            console.log('Successfully processed Google user:', user);
            resolve(user);
          } catch (error) {
            console.error('Error processing Google credential:', error);
            reject(new Error(`Failed to process Google credential: ${error.message}`));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt for sign-in
      window.google.accounts.id.prompt((notification) => {
        console.log('Google prompt notification:', notification);
        console.log('Notification details:', {
          isDisplayed: !notification.isNotDisplayed(),
          isSkipped: notification.isSkippedMoment(),
          getDismissedReason: notification.getDismissedReason ? notification.getDismissedReason() : 'N/A',
          getNotDisplayedReason: notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : 'N/A',
          getSkippedReason: notification.getSkippedReason ? notification.getSkippedReason() : 'N/A'
        });
        
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt not displayed, falling back to OAuth2 popup');
          console.log('Not displayed reason:', notification.getNotDisplayedReason ? notification.getNotDisplayedReason() : 'unknown');
          
          // Fallback to popup
          try {
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const allowedDomain = import.meta.env.VITE_ALLOWED_DOMAIN;
            console.log('OAuth2 config:', { clientId, allowedDomain });
            
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              hosted_domain: allowedDomain,
              callback: async (tokenResponse) => {
                try {
                  console.log('OAuth2 token response:', tokenResponse);
                  
                  // Get user info using the access token
                  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  });

                  if (!response.ok) {
                    throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
                  }

                  const userInfo = await response.json();
                  console.log('Google user info:', userInfo);
                  
                  // Check domain restriction
                  const allowedDomain = import.meta.env.VITE_ALLOWED_DOMAIN;
                  console.log('OAuth2 domain check. User domain:', userInfo.hd, 'Allowed domain:', allowedDomain);
                  
                  if (userInfo.hd !== allowedDomain) {
                    reject(new Error(`Only ${allowedDomain} email addresses are allowed. Your domain: ${userInfo.hd || 'none'}`));
                    return;
                  }

                  const user: GoogleUser = {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    picture: userInfo.picture,
                    hd: userInfo.hd
                  };

                  console.log('OAuth2 successfully processed user:', user);
                  resolve(user);
                } catch (error) {
                  console.error('OAuth2 callback error:', error);
                  reject(error);
                }
              },
              error_callback: (error) => {
                console.error('OAuth2 error callback:', error);
                reject(new Error(`OAuth2 error: ${error.type} - ${error.details}`));
              }
            });
            
            console.log('Requesting OAuth2 access token...');
            tokenClient.requestAccessToken();
          } catch (error) {
            console.error('Failed to initialize OAuth2 client:', error);
            reject(new Error(`Failed to initialize OAuth2: ${error.message}`));
          }
        }
      });
    });
  }

  async signOut(): Promise<void> {
    if (!window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.disableAutoSelect();
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    // Google Identity Services doesn't maintain session state
    // We rely on the application's localStorage for session persistence
    return null;
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export const googleAuthService = GoogleAuthService.getInstance();