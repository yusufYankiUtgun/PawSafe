import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String displayName;
  final String email;
  final String role; // "user" | "admin"
  final bool notificationsEnabled;
  final int notificationRadius; // metres
  final GeoPoint? homeLocation;
  final String? fcmToken;

  const UserModel({
    required this.uid,
    required this.displayName,
    required this.email,
    this.role = 'user',
    this.notificationsEnabled = true,
    this.notificationRadius = 1000,
    this.homeLocation,
    this.fcmToken,
  });

  bool get isAdmin => role == 'admin';

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel(
      uid: doc.id,
      displayName: data['displayName'] as String? ?? '',
      email: data['email'] as String? ?? '',
      role: data['role'] as String? ?? 'user',
      notificationsEnabled: data['notificationsEnabled'] as bool? ?? true,
      notificationRadius: data['notificationRadius'] as int? ?? 1000,
      homeLocation: data['homeLocation'] as GeoPoint?,
      fcmToken: data['fcmToken'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'uid': uid,
        'displayName': displayName,
        'email': email,
        'role': role,
        'notificationsEnabled': notificationsEnabled,
        'notificationRadius': notificationRadius,
        if (homeLocation != null) 'homeLocation': homeLocation,
        if (fcmToken != null) 'fcmToken': fcmToken,
      };

  UserModel copyWith({
    String? displayName,
    bool? notificationsEnabled,
    int? notificationRadius,
    GeoPoint? homeLocation,
    String? fcmToken,
  }) =>
      UserModel(
        uid: uid,
        displayName: displayName ?? this.displayName,
        email: email,
        role: role,
        notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
        notificationRadius: notificationRadius ?? this.notificationRadius,
        homeLocation: homeLocation ?? this.homeLocation,
        fcmToken: fcmToken ?? this.fcmToken,
      );
}
