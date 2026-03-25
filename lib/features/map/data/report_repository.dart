import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/models/report_model.dart';

class ReportRepository {
  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;
  final FirebaseAuth _auth;

  ReportRepository({
    FirebaseFirestore? firestore,
    FirebaseStorage? storage,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _storage = storage ?? FirebaseStorage.instance,
        _auth = auth ?? FirebaseAuth.instance;

  // ── Watch active (non-deleted) reports filtered by time window ──────────────

  Stream<List<ReportModel>> watchActiveReports(Duration? window) {
    Query<Map<String, dynamic>> query = _firestore
        .collection(AppConstants.reportsCollection)
        .where(AppConstants.fieldDeleted, isEqualTo: false)
        .orderBy(AppConstants.fieldTimestamp, descending: true);

    if (window != null) {
      final cutoff = Timestamp.fromDate(
        DateTime.now().toUtc().subtract(window),
      );
      query = query.where(AppConstants.fieldTimestamp,
          isGreaterThanOrEqualTo: cutoff);
    }

    return query.snapshots().map(
          (snap) =>
              snap.docs.map((d) => ReportModel.fromFirestore(d)).toList(),
        );
  }

  // ── Submit a new report ─────────────────────────────────────────────────────

  Future<void> submitReport(ReportDraft draft) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated.');

    // Rate limit check – count reports submitted in the last 60 minutes.
    final hourAgo = Timestamp.fromDate(
      DateTime.now().toUtc().subtract(const Duration(hours: 1)),
    );
    final recentSnap = await _firestore
        .collection(AppConstants.reportsCollection)
        .where(AppConstants.fieldUid, isEqualTo: uid)
        .where(AppConstants.fieldTimestamp, isGreaterThanOrEqualTo: hourAgo)
        .get();

    if (recentSnap.docs.length >= AppConstants.maxReportsPerHour) {
      throw RateLimitException(
        'You have reached the limit of ${AppConstants.maxReportsPerHour} '
        'reports per hour. Please try again later.',
      );
    }

    String? photoUrl;
    if (draft.localImagePath != null) {
      photoUrl = await _uploadPhoto(uid, draft.localImagePath!);
    }

    final docRef =
        _firestore.collection(AppConstants.reportsCollection).doc();
    final report = ReportModel(
      id: docRef.id,
      uid: uid,
      location: draft.location,
      timestamp: DateTime.now().toUtc(),
      description: draft.description,
      photoUrl: photoUrl,
      district: draft.district,
    );

    await docRef.set(report.toFirestore());
  }

  // ── Soft delete (admin) ─────────────────────────────────────────────────────

  Future<void> deleteReport(String reportId) async {
    await _firestore
        .collection(AppConstants.reportsCollection)
        .doc(reportId)
        .update({AppConstants.fieldDeleted: true});
  }

  // ── Upload photo to Firebase Storage ────────────────────────────────────────

  Future<String> _uploadPhoto(String uid, String localPath) async {
    final file = File(localPath);
    final fileName = '${const Uuid().v4()}.jpg';
    final ref = _storage
        .ref()
        .child('report_photos')
        .child(uid)
        .child(fileName);

    final uploadTask = await ref.putFile(
      file,
      SettableMetadata(contentType: 'image/jpeg'),
    );

    return uploadTask.ref.getDownloadURL();
  }

  // ── Fetch all reports (admin) ────────────────────────────────────────────────

  Stream<List<ReportModel>> watchAllReports() {
    return _firestore
        .collection(AppConstants.reportsCollection)
        .orderBy(AppConstants.fieldTimestamp, descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => ReportModel.fromFirestore(d)).toList());
  }
}

class RateLimitException implements Exception {
  final String message;
  const RateLimitException(this.message);

  @override
  String toString() => message;
}

// ── Riverpod provider ────────────────────────────────────────────────────────

final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository();
});
