import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../shared/models/report_model.dart';

class AdminRepository {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  AdminRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  /// Watch ALL reports (including deleted) for the admin table.
  Stream<List<ReportModel>> watchAllReports() {
    return _firestore
        .collection(AppConstants.reportsCollection)
        .orderBy(AppConstants.fieldTimestamp, descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => ReportModel.fromFirestore(d)).toList());
  }

  /// Soft-delete a report and write an audit log entry.
  Future<void> deleteReport(String reportId) async {
    final adminUid = _auth.currentUser?.uid;
    if (adminUid == null) throw Exception('Not authenticated.');

    final batch = _firestore.batch();

    // 1. Soft-delete the report.
    final reportRef = _firestore
        .collection(AppConstants.reportsCollection)
        .doc(reportId);
    batch.update(reportRef, {AppConstants.fieldDeleted: true});

    // 2. Write audit log.
    final auditRef =
        _firestore.collection(AppConstants.auditLogCollection).doc();
    batch.set(auditRef, {
      'adminUid': adminUid,
      'reportId': reportId,
      'action': 'delete',
      'timestamp': FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }

  /// Restore a previously deleted report.
  Future<void> restoreReport(String reportId) async {
    final adminUid = _auth.currentUser?.uid;
    if (adminUid == null) throw Exception('Not authenticated.');

    final batch = _firestore.batch();

    final reportRef = _firestore
        .collection(AppConstants.reportsCollection)
        .doc(reportId);
    batch.update(reportRef, {AppConstants.fieldDeleted: false});

    final auditRef =
        _firestore.collection(AppConstants.auditLogCollection).doc();
    batch.set(auditRef, {
      'adminUid': adminUid,
      'reportId': reportId,
      'action': 'restore',
      'timestamp': FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
}

// ── Riverpod provider ─────────────────────────────────────────────────────────

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return AdminRepository();
});

final allReportsProvider = StreamProvider<List<ReportModel>>((ref) {
  return ref.watch(adminRepositoryProvider).watchAllReports();
});
