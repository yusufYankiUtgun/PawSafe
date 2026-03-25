# Firebase Setup Guide

This guide walks you through creating the Firebase project and connecting it to PawSafe.

---

## 1. Create a Firebase Project

1. Open [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `pawsafe` (or any name you choose)
4. Disable Google Analytics (not needed for this project)
5. Click **Create project**

---

## 2. Enable Authentication

1. In the Firebase Console, go to **Authentication → Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**
4. Save

---

## 3. Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Select **Start in production mode** (security rules will be deployed separately)
3. Choose a region close to your users (e.g., `europe-west3` for Turkey)
4. Click **Enable**

---

## 4. Enable Firebase Storage

1. Go to **Storage → Get started**
2. Select **Start in production mode**
3. Choose the same region as Firestore
4. Click **Done**

---

## 5. Add Apps to Your Firebase Project

### Android

1. In Firebase Console → **Project settings → Your apps**
2. Click **Add app → Android**
3. Package name: `com.pawsafe.app`
4. Download `google-services.json`
5. Place it at: `android/app/google-services.json`

### iOS

1. Click **Add app → iOS**
2. Bundle ID: `com.pawsafe.app`
3. Download `GoogleService-Info.plist`
4. Place it at: `ios/Runner/GoogleService-Info.plist`

### Web (for Admin Panel)

1. Click **Add app → Web**
2. App nickname: `PawSafe Web`
3. Copy the Firebase config object (you'll need it for `firebase_options.dart`)

---

## 6. Configure firebase_options.dart

Run the FlutterFire CLI (easiest approach):

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# From the project root:
flutterfire configure
```

This automatically generates `lib/firebase_options.dart` with the correct values
for all platforms. **This replaces the placeholder file already in the repo.**

**Alternatively**, manually fill in `lib/firebase_options.dart`:
- Copy your Android API key, app ID, project ID, sender ID from Firebase Console
- Copy your iOS values
- Copy your Web values

---

## 7. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

---

## 8. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

---

## 9. Deploy Storage Rules

```bash
firebase deploy --only storage
```

---

## 10. Set Up Cloud Messaging (FCM)

For FCM push notifications on iOS:
1. You need an Apple Developer account
2. Generate an **APNs Authentication Key** in Apple Developer Portal
3. Upload it in Firebase Console → **Project settings → Cloud Messaging → Apple app configuration**

For Android, FCM works out of the box with the `google-services.json`.

---

## 11. Enable Firestore Composite Indexes

When the app first runs queries (filtered reports), Firestore may ask you to create
composite indexes. A direct link will appear in your Flutter debug console.
Alternatively, deploy the indexes file:

```bash
firebase deploy --only firestore:indexes
```

---

## 12. Create an Admin User

To give a user admin access:

1. Have them register via the app
2. Open Firebase Console → **Firestore → users collection**
3. Find their document (identified by their UID)
4. Edit the `role` field from `"user"` to `"admin"`

That's it. The app and Cloud Functions check this field to grant admin access.

---

## Quick Reference: Firebase Console URLs

| Service | URL |
|---|---|
| Firebase Console | https://console.firebase.google.com |
| Authentication | Console → Authentication |
| Firestore | Console → Firestore Database |
| Storage | Console → Storage |
| Functions | Console → Functions |
| FCM | Console → Project Settings → Cloud Messaging |
