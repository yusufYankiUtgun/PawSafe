/// Central constants used across the app.
class AppConstants {
  AppConstants._();

  // ── Firestore collection names ──────────────────────────────────────────────
  static const String reportsCollection = 'reports';
  static const String usersCollection = 'users';
  static const String auditLogCollection = 'audit_log';

  // ── Report limits ────────────────────────────────────────────────────────────
  static const int maxReportsPerHour = 5;
  static const int maxDescriptionLength = 200;
  static const double maxPhotoSizeMb = 5.0;
  static const int maxPhotoBytes = 5 * 1024 * 1024; // 5 MB

  // ── Map defaults ─────────────────────────────────────────────────────────────
  static const double defaultLatitude = 41.0082; // Istanbul
  static const double defaultLongitude = 28.9784;
  static const double defaultZoom = 13.0;
  static const double markerZoom = 16.0;

  // ── Notification ─────────────────────────────────────────────────────────────
  static const int defaultNotificationRadiusMeters = 1000;

  // ── Map refresh interval ─────────────────────────────────────────────────────
  static const Duration mapRefreshInterval = Duration(seconds: 30);

  // ── Admin ────────────────────────────────────────────────────────────────────
  static const String adminRole = 'admin';
  static const String userRole = 'user';

  // ── Firestore field names ─────────────────────────────────────────────────────
  static const String fieldDeleted = 'deleted';
  static const String fieldTimestamp = 'timestamp';
  static const String fieldUid = 'uid';
  static const String fieldRole = 'role';
}
