import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Call once after login to request permission and save the FCM token.
  Future<void> initialize() async {
    // FCM is not fully supported in Flutter Web in local dev – skip gracefully.
    if (kIsWeb) return;

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      await _saveToken();
    }

    // Refresh token whenever it rotates.
    _messaging.onTokenRefresh.listen(_persistToken);

    // Foreground messages – just log in dev; production would show a local notif.
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground: ${message.notification?.title}');
    });
  }

  Future<void> _saveToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) await _persistToken(token);
    } catch (e) {
      debugPrint('[FCM] Token fetch failed: $e');
    }
  }

  Future<void> _persistToken(String token) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    try {
      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(uid)
          .update({'fcmToken': token});
    } catch (e) {
      debugPrint('[FCM] Token persist failed: $e');
    }
  }

  /// Remove the FCM token on logout so the user stops receiving notifications.
  Future<void> clearToken() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    try {
      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(uid)
          .update({'fcmToken': FieldValue.delete()});
    } catch (_) {}
  }
}
