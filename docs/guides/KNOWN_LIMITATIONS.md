# Known Limitations and Engineering Assumptions

This document records every intentional simplification, assumption, and known gap
in the PawSafe MVP implementation. These are not bugs — they are deliberate
trade-offs for course-assignment scope.

---

## Decisions Made for MVP

### 1. Soft Delete vs Hard Delete

**Decision:** All admin "deletions" are soft deletes (`deleted: true` in Firestore).

**Why:** Soft delete preserves audit trail, allows restore, and matches the
design document's admin audit log requirement. One document used the term
"permanently delete" but this was treated as user-facing language, not a
hard-delete instruction.

---

### 2. District / Area Name Resolution

**Decision:** Area name uses reverse geocoding via the `geocoding` package.
If geocoding fails (no internet, rate limit, etc.), it falls back to
`"lat, lng"` coordinate string.

**Why:** The documents referenced "district" as an analytics grouping field
but provided no geocoding implementation. This approach gives real area names
when possible and a consistent fallback when not.

**Production improvement:** Use a backend Cloud Function with the Google Geocoding
API for server-side, cached area name resolution.

---

### 3. Push Notification Radius Filtering

**Decision (Simplification):** The `onReportCreated` Cloud Function sends
notifications to **all** users with `notificationsEnabled: true` and a valid
FCM token. It does **not** filter by geographic radius.

**Why:** Firestore does not support native geospatial range queries.
Full radius filtering requires either:
- GeoHash-based queries (geohash library)
- A separate PostGIS / spatial database
- Cloud Function that reads all users and computes distances in-memory

For the MVP demo, broadcasting to all opted-in users still demonstrates the
full notification pipeline. The code contains a marked `// PRODUCTION TODO`
comment showing exactly where radius filtering should be inserted.

**Production improvement:** Implement GeoHash-based queries with the `geoflutterfire2`
package or use a Firebase Extension for geospatial queries.

---

### 4. Rate Limiting Implementation

**Decision:** Rate limiting is implemented client-side in `ReportRepository.submitReport()`
via a Firestore query that counts the user's reports in the last 60 minutes.

**Why:** A Cloud Function rate-limit endpoint (documented as optional in the
analysis) adds latency and complexity. Client-side enforcement is sufficient for
the assignment scope.

**Production improvement:** Move rate-limit enforcement to a Cloud Function
callable or Firestore Security Rule to prevent API bypass.

---

### 5. Marker Clustering

**Decision:** Marker clustering is NOT implemented in this MVP.

**Why:** The `google_maps_flutter` package does not natively support clustering.
Implementing it requires either:
- Manual clustering logic (complex)
- The `google_maps_cluster_manager` third-party package (adds setup overhead)

The requirements document listed clustering as "Low" priority (PB-13, FR-13).

**Production improvement:** Add the `google_maps_cluster_manager` package and
wrap the marker set in a `ClusterManager`.

---

### 6. Heatmap Toggle

**Decision:** Heatmap toggle (mentioned in the design document's UI description)
is NOT implemented.

**Why:** The `google_maps_flutter` package does not expose a heatmap layer API
on all platforms. Heatmap was described as a UI element in the wireframe description
but has no corresponding functional requirement (FR-XX) in the requirements doc.

**Production improvement:** Use the Google Maps JavaScript API heatmap layer
in the Flutter Web version via a platform view or custom HTML embedding.

---

### 7. Analytics Computation

**Decision:** Analytics are computed on-demand in the Flutter app by fetching
all active reports from Firestore and processing them locally.

**Why:** The `getAreaAnalytics` Cloud Function exists and is deployed, but for
the MVP the Flutter `AnalyticsRepository` does the same computation locally to
reduce dependency on a deployed function during development.

**Production improvement:** Use the `getAreaAnalytics` Cloud Function to offload
computation from the client. Add a Firestore `analytics` collection for
pre-aggregated daily stats (written by a Cloud Function scheduled trigger).

---

### 8. Offline Draft Queue

**Decision:** Offline report drafting (saving a draft when offline and submitting
when reconnected) is NOT implemented.

**Why:** Not mentioned in the requirements (FR-04 only requires authenticated
online submission). Firestore's offline persistence handles read-side caching
automatically.

---

### 9. Admin Panel Platform

**Decision:** Admin panel is a Flutter Web screen within the same Flutter codebase,
not a separate web application.

**Why:** The design document explicitly chose Flutter Web for the admin panel:
"Admin Dashboard: Flutter Web – same codebase extension."

---

### 10. Home Location Setting

**Decision:** Home location is stored in Firestore as a `GeoPoint` but the UI
settings screen does not implement a map-picker for home location.

**Why:** A map picker widget is a non-trivial UI component. The `notificationRadius`
slider is implemented. Home location can be set directly in Firestore console
during demo, or via future UI implementation.

---

### 11. Display Name on Registration

**Decision:** Display name is collected in the registration form.

**Why:** The requirements document did not explicitly require a display name field
in the registration UI, but `UserModel` requires a `displayName`. Collecting it
at registration is the cleanest UX approach.

---

### 12. Firebase Emulators vs Live Project

**Decision:** The app is configured to run against a live Firebase project by default.
Emulator support requires manual code changes (documented in LOCAL_RUN.md).

**Why:** Emulators require additional setup and are harder to demo. For a course
assignment, a shared live Firebase project is simpler to demonstrate.

---

## Known Gaps Requiring Future Work

| Gap | Priority | Effort |
|---|---|---|
| Marker clustering | Low | Medium |
| Heatmap layer | Low | High |
| Geospatial radius notification filter | Medium | High |
| Map-based home location picker | Low | Medium |
| Image moderation (remove photos of deleted reports) | Medium | Medium |
| Firestore pagination (large report sets) | Medium | Medium |
| Unit and widget tests | High | High |
| Admin user creation UI | Low | Low |
| Scheduled analytics aggregation (Cloud Function) | Medium | Medium |

---

## Testing Status

**Current state:** No automated tests have been written for this MVP.

**Required:** The requirements document specifies ≥ 80% test case pass rate.

**Next steps:**
1. Write unit tests for `AuthRepository`, `ReportRepository`, `AnalyticsRepository`
2. Write widget tests for Login, Register, Report Form screens
3. Write integration tests for the full report submission flow
4. Run `flutter test` to execute all tests
