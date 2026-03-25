import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../shared/models/report_model.dart';

class ReportDetailSheet extends StatelessWidget {
  final ReportModel report;

  const ReportDetailSheet({super.key, required this.report});

  static void show(BuildContext context, ReportModel report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ReportDetailSheet(report: report),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final df = DateFormat('MMM d, y  HH:mm');

    return DraggableScrollableSheet(
      initialChildSize: 0.45,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      expand: false,
      builder: (_, scrollCtrl) {
        return ListView(
          controller: scrollCtrl,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            // ── Drag handle ──────────────────────────────────────────────────
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // ── Header ───────────────────────────────────────────────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.pets,
                      color: theme.colorScheme.onPrimaryContainer),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Stray Dog Reported',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold)),
                      Text(report.district,
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                _RecencyBadge(timestamp: report.timestamp),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),

            // ── Timestamp ────────────────────────────────────────────────────
            _InfoRow(
              icon: Icons.access_time,
              label: 'Reported at',
              value: df.format(report.timestamp.toLocal()),
            ),
            const SizedBox(height: 8),

            // ── Coordinates ──────────────────────────────────────────────────
            _InfoRow(
              icon: Icons.location_on_outlined,
              label: 'Coordinates',
              value:
                  '${report.location.latitude.toStringAsFixed(5)}, '
                  '${report.location.longitude.toStringAsFixed(5)}',
            ),

            // ── Description ───────────────────────────────────────────────────
            if (report.description != null &&
                report.description!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.notes_outlined,
                label: 'Description',
                value: report.description!,
              ),
            ],

            // ── Photo ────────────────────────────────────────────────────────
            if (report.photoUrl != null) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  report.photoUrl!,
                  height: 220,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 120,
                    color: theme.colorScheme.surfaceContainerHighest,
                    child: const Center(
                        child: Icon(Icons.broken_image_outlined)),
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant)),
              Text(value, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _RecencyBadge extends StatelessWidget {
  final DateTime timestamp;

  const _RecencyBadge({required this.timestamp});

  @override
  Widget build(BuildContext context) {
    final age = DateTime.now().difference(timestamp);
    final Color color;
    final String label;

    if (age.inHours < 1) {
      color = Colors.red.shade600;
      label = '< 1h ago';
    } else if (age.inHours < 6) {
      color = Colors.orange.shade600;
      label = '${age.inHours}h ago';
    } else if (age.inHours < 24) {
      color = Colors.amber.shade700;
      label = '${age.inHours}h ago';
    } else {
      color = Colors.grey.shade600;
      label = '${age.inDays}d ago';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
