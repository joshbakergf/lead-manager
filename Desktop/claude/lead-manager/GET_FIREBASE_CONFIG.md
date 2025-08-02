# 🔧 Get Correct Firebase Configuration

## The Problem
The Firebase API key is invalid: `auth/api-key-not-valid`

## 🚨 GET CORRECT CONFIG FROM FIREBASE

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/project/interactive-call-script/settings/general
2. Scroll down to "Your apps" section
3. Look for the web app (🌐 icon)

### Step 2: Get Web App Config
1. Click on the **web app** (should show something like "lead-manager" or similar)
2. Click **"Config"** button
3. Copy the **entire firebaseConfig object**

It should look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "interactive-call-script.firebaseapp.com",
  projectId: "interactive-call-script",
  storageBucket: "interactive-call-script.appspot.com",
  messagingSenderId: "388701133207",
  appId: "1:388701133207:web:..."
};
```

### Step 3: Alternative - Create New Web App
If no web app exists:
1. Click **"Add app"** → **Web** (🌐)
2. Name it: **"lead-manager"**
3. **Check** "Also set up Firebase Hosting"
4. Click **"Register app"**
5. Copy the config that appears

## 🎯 What I Need
Please copy and paste the **complete firebaseConfig object** from Firebase Console.

The current API key `AIzaSyBKF4Ru0ZGMO6x5MjJl9j4_vPtNVjHlWEc` is invalid and needs replacement.

## 🔍 Double-Check Project
Also verify you're in the correct project:
- **Project ID**: `interactive-call-script`
- **URL**: https://console.firebase.google.com/project/interactive-call-script

**Please get the correct Firebase config and paste it here!** 🚀