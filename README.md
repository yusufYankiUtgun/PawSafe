# PawSafe – Stray Dog Location Reporting System

A Flutter + Firebase mobile application that allows users to report and view
stray dog locations on a real-time interactive map. Users can drop GPS-tagged
markers, filter reports by time, and receive push notifications for nearby
sightings. An admin panel allows moderators to moderate false reports.

---

## Team Members

| Name | Role |
|---|---|
| Yusuf Yankı Ütgün | Project Manager / Developer |
| Eren Can Dönertaş | Frontend Developer (Flutter) |
| Yiğit Eren Yılmaz | Backend Developer (Firebase) |
| Enes Kerem Göksu | UI/UX Designer / Developer |

---

## Implementation Status

| Feature | Status |
|---|---|
| Email/password registration & login | Implemented |
| Forgot password (reset link) | Implemented |
| GPS-based stray dog location reporting | Implemented |
| Optional photo attachment (5 MB limit) | Implemented |
| Real-time map with color-coded markers | Implemented |
| Time filter chips: 1h / 6h / 24h / All | Implemented |
| Marker detail bottom sheet | Implemented |
| Rate limiting (5 reports/hour) | Implemented |
| Admin moderation dashboard (Flutter Web) | Implemented |
| Soft delete + audit log | Implemented |
| Push notifications (FCM) | Implemented |
| Analytics screen (7-day chart + area breakdown) | Implemented |
| Settings (name, notifications, radius) | Implemented |
| Auth-aware routing with GoRouter guards | Implemented |
| Firebase Security Rules | Implemented |
| Marker clustering | Not in MVP (see Known Limitations) |
| Heatmap toggle | Not in MVP (see Known Limitations) |
| Geospatial notification radius | Simplified (broadcasts to all opted-in users) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Flutter 3.x (Dart) |
| State Management | Riverpod 2.x |
| Navigation | GoRouter 13.x |
| Backend | Firebase Cloud Functions (Node.js 18 / TypeScript) |
| Database | Cloud Firestore |
| Authentication | Firebase Auth |
| File Storage | Firebase Storage |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Maps | Google Maps Flutter Plugin |
| Location | geolocator + geocoding |
| Charts | fl_chart |
| Design | Figma |
| Version Control | GitHub |

---

## Project Structure

```
PawSafe/
├── lib/
│   ├── main.dart                          # App entry point
│   ├── firebase_options.dart              # ⚠️ Generate via flutterfire configure
│   ├── core/
│   │   ├── constants/app_constants.dart
│   │   ├── theme/app_theme.dart           # Material 3 theme
│   │   ├── router/app_router.dart         # GoRouter + auth guards
│   │   └── services/
│   │       ├── location_service.dart      # GPS + reverse geocoding
│   │       └── notification_service.dart  # FCM token management
│   ├── shared/
│   │   ├── models/user_model.dart
│   │   ├── models/report_model.dart
│   │   └── widgets/
│   └── features/
│       ├── auth/          # Login, Register, Forgot Password
│       ├── map/           # Live map screen, markers, filter chips
│       ├── reporting/     # Report submission form
│       ├── admin/         # Admin moderation dashboard
│       ├── analytics/     # Analytics screen
│       └── settings/      # User settings screen
├── functions/src/index.ts # Cloud Functions (TypeScript)
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── firebase.json
└── docs/
    ├── guides/
    │   ├── FIREBASE_SETUP.md
    │   ├── LOCAL_RUN.md
    │   └── KNOWN_LIMITATIONS.md
    ├── PA1-Part1/
    ├── PA1-Part2/
    └── PA2-Part1/
```

---

## Prerequisites

| Tool | Install |
|---|---|
| Flutter SDK >= 3.16 | https://flutter.dev/docs/get-started/install |
| Node.js >= 18 | https://nodejs.org |
| Firebase CLI | `npm install -g firebase-tools` |
| FlutterFire CLI | `dart pub global activate flutterfire_cli` |

---

## Quick Start

```bash
# 1. Create Flutter native scaffolding (does NOT overwrite lib/)
flutter create . --project-name pawsafe --org com.pawsafe

# 2. Install Flutter dependencies
flutter pub get

# 3. Login and configure Firebase (generates lib/firebase_options.dart)
firebase login
flutterfire configure

# 4. Add Google Maps API key to android/app/src/main/AndroidManifest.xml
#    and ios/Runner/AppDelegate.swift (see docs/guides/LOCAL_RUN.md)

# 5. Install and deploy Cloud Functions
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,firestore:indexes,storage,functions

# 6. Run the app
flutter run                  # Android / iOS
flutter run -d chrome        # Web (admin panel)
```

Full setup guide: [docs/guides/LOCAL_RUN.md](docs/guides/LOCAL_RUN.md)
Firebase setup guide: [docs/guides/FIREBASE_SETUP.md](docs/guides/FIREBASE_SETUP.md)

---

## Creating an Admin User

1. Register via the app
2. Firebase Console → Firestore → `users` collection → find your document
3. Edit the `role` field: `"user"` → `"admin"`
4. Restart the app — Admin Dashboard becomes accessible via Settings

---

## Firestore Data Schema

```
reports/{id}   : uid, location (GeoPoint), timestamp, description?, photoUrl?,
                 deleted (bool), district (string)
users/{uid}    : uid, displayName, email, role, notificationsEnabled,
                 notificationRadius, homeLocation?, fcmToken?
audit_log/{id} : adminUid, reportId, action, timestamp
```

---

## Known Limitations

See [docs/guides/KNOWN_LIMITATIONS.md](docs/guides/KNOWN_LIMITATIONS.md)

---

## Course

BIL 481 – Software Engineering
