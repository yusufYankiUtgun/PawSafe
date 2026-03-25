import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/report_repository.dart';
import '../../../../shared/models/report_model.dart';

// ── Time filter options ───────────────────────────────────────────────────────

enum TimeFilter {
  oneHour('1h', Duration(hours: 1)),
  sixHours('6h', Duration(hours: 6)),
  twentyFourHours('24h', Duration(hours: 24)),
  all('All', null);

  final String label;
  final Duration? duration;

  const TimeFilter(this.label, this.duration);
}

// ── Selected filter state ─────────────────────────────────────────────────────

final selectedFilterProvider =
    StateProvider<TimeFilter>((ref) => TimeFilter.twentyFourHours);

// ── Reports stream ────────────────────────────────────────────────────────────

final activeReportsProvider = StreamProvider<List<ReportModel>>((ref) {
  final filter = ref.watch(selectedFilterProvider);
  return ref
      .watch(reportRepositoryProvider)
      .watchActiveReports(filter.duration);
});
