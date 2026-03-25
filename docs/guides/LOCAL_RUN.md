# Local Run Guide

Step-by-step instructions to build and run PawSafe locally.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Flutter SDK | ≥ 3.16 | https://flutter.dev/docs/get-started/install |
| Dart SDK | ≥ 3.2 | Bundled with Flutter |
| Node.js | ≥ 18 | https://nodejs.org |
| Firebase CLI | latest | `npm install -g firebase-tools` |
| FlutterFire CLI | latest | `dart pub global activate flutterfire_cli` |
| Android Studio / Xcode | latest | For emulator or device |
| Google Cloud Account | - | For Maps API key |

---

## Step 1 – Clone and Initialize the Flutter Project

```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/pawsafe.git
cd pawsafe

# Initialize the Flutter native project files (generates android/, ios/, web/)
flutter create . --project-name pawsafe --org com.pawsafe

# Install Flutter dependencies
flutter pub get
```

> **Note:** `flutter create .` will not overwrite any existing files in `lib/`.
> It only creates the native project scaffolding that is missing.

---

## Step 2 – Set Up Firebase

Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) in full, then:

```bash
# Login to Firebase
firebase login

# Configure FlutterFire (generates lib/firebase_options.dart)
flutterfire configure
```

Select your Firebase project when prompted. Choose Android, iOS, and Web platforms.

---

## Step 3 – Configure Google Maps API Key

### Android

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an API key (or use existing)
3. Enable **Maps SDK for Android**
4. Open `android/app/src/main/AndroidManifest.xml`
5. Replace `YOUR_ANDROID_MAPS_API_KEY` with your actual key

### iOS

1. Enable **Maps SDK for iOS** in Google Cloud Console
2. Open `ios/Runner/AppDelegate.swift`
3. Add:
   ```swift
   import GoogleMaps
   // In application(_:didFinishLaunchingWithOptions:):
   GMSServices.provideAPIKey("YOUR_IOS_MAPS_API_KEY")
   ```

### Web

1. Enable **Maps JavaScript API** in Google Cloud Console
2. Open `web/index.html`
3. Find or add the Maps script tag:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_WEB_MAPS_API_KEY"></script>
   ```

---

## Step 4 – Run the Mobile App (Android/iOS)

```bash
# List available devices/emulators
flutter devices

# Run on a specific device
flutter run -d <device-id>

# Run on Android emulator
flutter run -d android

# Run on iOS simulator (macOS only)
flutter run -d ios
```

---

## Step 5 – Run the Admin Web Panel

```bash
# Run Flutter Web (Chrome)
flutter run -d chrome
```

The admin panel is accessible via the Settings screen if the logged-in user has
the `admin` role in Firestore.

To navigate directly to the admin dashboard:
- In the running app, go to Settings → Admin Dashboard
- Or navigate to route `/admin` in the web build

---

## Step 6 – Set Up and Deploy Cloud Functions

```bash
cd functions

# Install Node.js dependencies
npm install

# Build TypeScript
npm run build

# Return to project root
cd ..

# Deploy functions to Firebase
firebase deploy --only functions

# Or deploy everything at once
firebase deploy
```

---

## Step 7 – (Optional) Run Firebase Emulators Locally

For offline/local development without connecting to a real Firebase project:

```bash
# Start all emulators (Auth, Firestore, Functions, Storage)
firebase emulators:start
```

Emulator UI is available at: http://localhost:4000

To connect the Flutter app to emulators, add this to `lib/main.dart`
before `Firebase.initializeApp()`:

```dart
// DEVELOPMENT ONLY – remove before deploying
if (kDebugMode) {
  FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
  FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
  FirebaseStorage.instance.useStorageEmulator('localhost', 9199);
}
```

---

## Quick Command Reference

```bash
# Install deps
flutter pub get

# Run on Android
flutter run -d android

# Run on Chrome (web admin)
flutter run -d chrome

# Build release APK
flutter build apk --release

# Build web (for admin hosting)
flutter build web --release

# Deploy Firebase everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules,storage

# View function logs
firebase functions:log

# Start emulators
firebase emulators:start
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `firebase_options.dart` missing | Run `flutterfire configure` |
| Map shows blank/grey | Check Maps API key in AndroidManifest.xml |
| Location permission denied | Check device settings / emulator location |
| FCM tokens not saved | Ensure `notificationsEnabled: true` in Firestore user doc |
| Admin panel not visible | Set `role: "admin"` on user doc in Firestore Console |
| Firestore index error | Follow the link in the console output or run `firebase deploy --only firestore:indexes` |
| `google-services.json` missing | Download from Firebase Console and place at `android/app/` |
