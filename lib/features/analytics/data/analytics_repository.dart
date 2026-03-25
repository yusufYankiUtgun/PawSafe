import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';

class DailyCount {
  final DateTime date;
  final int count;

  const DailyCount({required this.date, required this.count});
}

class AreaCount {
  final String district;
  final int count;

  const AreaCount({required this.district, required this.count});
}

class AnalyticsSummary {
  final List<DailyCount> dailyCounts;   // last 7 days
  final List<AreaCount> areaCounts;     // top areas
  final int totalActive;
  final int totalAllTime;

  const AnalyticsSummary({
    required this.dailyCounts,
    required this.areaCounts,
    required this.totalActive,
    required this.totalAllTime,
  });
}

class AnalyticsRepository {
  final FirebaseFirestore _firestore;

  AnalyticsRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Computes analytics on demand from Firestore (MVP approach).
  /// For production, pre-aggregated data via Cloud Functions is preferred.
  Future<AnalyticsSummary> fetchSummary() async {
    // Fetch all active reports.
    final snap = await _firestore
        .collection(AppConstants.reportsCollection)
        .where(AppConstants.fieldDeleted, isEqualTo: false)
        .get();

    final docs = snap.docs;
    final now = DateTime.now();
    final sevenDaysAgo = now.subtract(const Duration(days: 7));

    // ── Daily counts (last 7 days) ─────────────────────────────────────────
    final Map<String, int> dailyMap = {};
    for (var i = 0; i < 7; i++) {
      final d = now.subtract(Duration(days: i));
      dailyMap[_dateKey(d)] = 0;
    }

    // ── Area counts ───────────────────────────────────────────────────────
    final Map<String, int> areaMap = {};

    for (final doc in docs) {
      final data = doc.data();
      final ts = (data['timestamp'] as Timestamp).toDate();
      final district = data['district'] as String? ?? 'Unknown Area';

      // Daily
      if (ts.isAfter(sevenDaysAgo)) {
        final key = _dateKey(ts);
        dailyMap[key] = (dailyMap[key] ?? 0) + 1;
      }

      // Area
      areaMap[district] = (areaMap[district] ?? 0) + 1;
    }

    // ── All-time count (including deleted) ────────────────────────────────
    final allSnap = await _firestore
        .collection(AppConstants.reportsCollection)
        .count()
        .get();

    final dailyCounts = dailyMap.entries
        .map((e) => DailyCount(
              date: DateTime.parse(e.key),
              count: e.value,
            ))
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    final areaCounts = areaMap.entries
        .map((e) => AreaCount(district: e.key, count: e.value))
        .toList()
      ..sort((a, b) => b.count.compareTo(a.count));

    return AnalyticsSummary(
      dailyCounts: dailyCounts,
      areaCounts: areaCounts.take(10).toList(),
      totalActive: docs.length,
      totalAllTime: allSnap.count ?? 0,
    );
  }

  String _dateKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// ── Riverpod providers ────────────────────────────────────────────────────────

final analyticsRepositoryProvider = Provider<AnalyticsRepository>((ref) {
  return AnalyticsRepository();
});

final analyticsSummaryProvider =
    FutureProvider<AnalyticsSummary>((ref) async {
  return ref.watch(analyticsRepositoryProvider).fetchSummary();
});
