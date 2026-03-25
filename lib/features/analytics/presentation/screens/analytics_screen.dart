import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../shared/widgets/pawsafe_error_widget.dart';
import '../../data/analytics_repository.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(analyticsSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () => ref.invalidate(analyticsSummaryProvider),
          ),
        ],
      ),
      body: summaryAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => PawSafeErrorWidget(
          message: 'Failed to load analytics: $e',
          onRetry: () => ref.invalidate(analyticsSummaryProvider),
        ),
        data: (summary) => _AnalyticsContent(summary: summary),
      ),
    );
  }
}

class _AnalyticsContent extends StatelessWidget {
  final AnalyticsSummary summary;

  const _AnalyticsContent({required this.summary});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () async {},
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Stats row ──────────────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Active Reports',
                  value: '${summary.totalActive}',
                  icon: Icons.pets,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'All-Time Reports',
                  value: '${summary.totalAllTime}',
                  icon: Icons.history,
                  color: theme.colorScheme.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // ── 7-day trend chart ──────────────────────────────────────────────
          Text('Reports – Last 7 Days',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
              child: SizedBox(
                height: 200,
                child: summary.dailyCounts.isEmpty
                    ? const Center(child: Text('No data'))
                    : BarChart(
                        BarChartData(
                          gridData: FlGridData(
                            drawVerticalLine: false,
                            getDrawingHorizontalLine: (_) => FlLine(
                              color: theme.colorScheme.outline
                                  .withOpacity(0.2),
                              strokeWidth: 1,
                            ),
                          ),
                          borderData: FlBorderData(show: false),
                          titlesData: FlTitlesData(
                            leftTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 28,
                                getTitlesWidget: (val, _) => Text(
                                  val.toInt().toString(),
                                  style: theme.textTheme.labelSmall,
                                ),
                              ),
                            ),
                            rightTitles: const AxisTitles(
                                sideTitles:
                                    SideTitles(showTitles: false)),
                            topTitles: const AxisTitles(
                                sideTitles:
                                    SideTitles(showTitles: false)),
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 24,
                                getTitlesWidget: (val, _) {
                                  final idx = val.toInt();
                                  if (idx < 0 ||
                                      idx >=
                                          summary.dailyCounts.length) {
                                    return const SizedBox.shrink();
                                  }
                                  final date =
                                      summary.dailyCounts[idx].date;
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      DateFormat('M/d').format(date),
                                      style:
                                          theme.textTheme.labelSmall,
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          barGroups: summary.dailyCounts
                              .asMap()
                              .entries
                              .map((e) => BarChartGroupData(
                                    x: e.key,
                                    barRods: [
                                      BarChartRodData(
                                        toY: e.value.count.toDouble(),
                                        color:
                                            theme.colorScheme.primary,
                                        width: 18,
                                        borderRadius:
                                            const BorderRadius.vertical(
                                          top: Radius.circular(4),
                                        ),
                                      ),
                                    ],
                                  ))
                              .toList(),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Reports per area ───────────────────────────────────────────────
          Text('Reports by Area',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (summary.areaCounts.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.map_outlined,
                          size: 48, color: Colors.grey),
                      const SizedBox(height: 8),
                      Text('No area data yet.',
                          style: theme.textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
            )
          else
            ...summary.areaCounts.map((a) => _AreaRow(
                  areaCount: a,
                  max: summary.areaCounts.first.count,
                )),
        ],
      ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(
                        fontWeight: FontWeight.bold, color: color)),
            Text(label,
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _AreaRow extends StatelessWidget {
  final AreaCount areaCount;
  final int max;

  const _AreaRow({required this.areaCount, required this.max});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fraction = max > 0 ? areaCount.count / max : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(areaCount.district,
                      style: theme.textTheme.titleSmall,
                      overflow: TextOverflow.ellipsis),
                ),
                Text('${areaCount.count} report${areaCount.count == 1 ? '' : 's'}',
                    style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 6),
            LinearProgressIndicator(
              value: fraction,
              backgroundColor:
                  theme.colorScheme.primary.withOpacity(0.1),
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(4),
            ),
          ],
        ),
      ),
    );
  }
}
