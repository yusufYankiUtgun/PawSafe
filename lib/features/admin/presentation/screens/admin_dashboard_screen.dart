import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../features/auth/data/auth_repository.dart';
import '../../../../shared/models/report_model.dart';
import '../../../../shared/widgets/pawsafe_error_widget.dart';
import '../../data/admin_repository.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportsAsync = ref.watch(allReportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.admin_panel_settings),
            SizedBox(width: 8),
            Text('PawSafe Admin'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      body: reportsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => PawSafeErrorWidget(
          message: 'Failed to load reports: $e',
          onRetry: () => ref.invalidate(allReportsProvider),
        ),
        data: (reports) => _ReportTable(reports: reports),
      ),
    );
  }
}

class _ReportTable extends ConsumerWidget {
  final List<ReportModel> reports;

  const _ReportTable({required this.reports});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final df = DateFormat('MMM d, y HH:mm');
    final theme = Theme.of(context);

    if (reports.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No reports yet.'),
          ],
        ),
      );
    }

    // Summary chips
    final total = reports.length;
    final active = reports.where((r) => !r.deleted).length;
    final deleted = reports.where((r) => r.deleted).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Summary bar ────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Wrap(
            spacing: 8,
            children: [
              Chip(
                avatar: const Icon(Icons.bar_chart, size: 16),
                label: Text('Total: $total'),
              ),
              Chip(
                avatar:
                    const Icon(Icons.pets, size: 16, color: Colors.green),
                label: Text('Active: $active'),
                backgroundColor:
                    Colors.green.withOpacity(0.1),
              ),
              Chip(
                avatar: const Icon(Icons.delete_outline,
                    size: 16, color: Colors.red),
                label: Text('Removed: $deleted'),
                backgroundColor: Colors.red.withOpacity(0.1),
              ),
            ],
          ),
        ),

        // ── Report list ────────────────────────────────────────────────────
        Expanded(
          child: ListView.builder(
            itemCount: reports.length,
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
            itemBuilder: (context, index) {
              final report = reports[index];
              return Card(
                color: report.deleted
                    ? theme.colorScheme.surfaceContainerHighest.withOpacity(0.5)
                    : null,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: report.deleted
                        ? Colors.grey.shade200
                        : theme.colorScheme.primaryContainer,
                    child: Icon(
                      Icons.pets,
                      color: report.deleted
                          ? Colors.grey
                          : theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          report.district,
                          style: theme.textTheme.titleSmall?.copyWith(
                            decoration: report.deleted
                                ? TextDecoration.lineThrough
                                : null,
                            color: report.deleted
                                ? theme.colorScheme.onSurfaceVariant
                                : null,
                          ),
                        ),
                      ),
                      if (report.deleted)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.red.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text('REMOVED',
                              style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.red.shade800,
                                  fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(df.format(report.timestamp.toLocal())),
                      if (report.description != null &&
                          report.description!.isNotEmpty)
                        Text(
                          report.description!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall,
                        ),
                    ],
                  ),
                  trailing: report.deleted
                      ? IconButton(
                          icon: const Icon(Icons.restore,
                              color: Colors.green),
                          tooltip: 'Restore',
                          onPressed: () => _confirmRestore(
                              context, ref, report),
                        )
                      : IconButton(
                          icon: Icon(Icons.delete_outline,
                              color: theme.colorScheme.error),
                          tooltip: 'Delete',
                          onPressed: () => _confirmDelete(
                              context, ref, report),
                        ),
                  isThreeLine: report.description?.isNotEmpty == true,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, ReportModel report) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        icon: const Icon(Icons.delete_outline, color: Colors.red),
        title: const Text('Remove Report?'),
        content: Text(
          'This will hide the report from the live map.\n\n'
          'District: ${report.district}\n'
          'Reported: ${DateFormat('MMM d, y HH:mm').format(report.timestamp.toLocal())}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref
            .read(adminRepositoryProvider)
            .deleteReport(report.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Report removed and audit log updated.')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _confirmRestore(
      BuildContext context, WidgetRef ref, ReportModel report) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        icon: const Icon(Icons.restore, color: Colors.green),
        title: const Text('Restore Report?'),
        content: Text('Restore this report to the live map?\n\n'
            'District: ${report.district}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restore'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref
            .read(adminRepositoryProvider)
            .restoreReport(report.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Report restored to live map.')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }
}
