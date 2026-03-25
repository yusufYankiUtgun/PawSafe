import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../shared/models/report_model.dart';
import '../providers/map_providers.dart';
import '../widgets/report_detail_sheet.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  GoogleMapController? _mapController;
  Timer? _refreshTimer;
  bool _isOnline = true;

  static const _initialCamera = CameraPosition(
    target: LatLng(AppConstants.defaultLatitude, AppConstants.defaultLongitude),
    zoom: AppConstants.defaultZoom,
  );

  @override
  void initState() {
    super.initState();
    // Auto-refresh: invalidate the stream every 30 s to pick up server-side changes.
    _refreshTimer = Timer.periodic(AppConstants.mapRefreshInterval, (_) {
      ref.invalidate(activeReportsProvider);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  Set<Marker> _buildMarkers(
      List<ReportModel> reports, BuildContext context) {
    final now = DateTime.now();
    return reports.map((report) {
      final age = now.difference(report.timestamp);
      final hue = _markerHue(age);

      return Marker(
        markerId: MarkerId(report.id),
        position: report.latLng,
        icon: BitmapDescriptor.defaultMarkerWithHue(hue),
        infoWindow: InfoWindow(
          title: 'Stray Dog – ${report.district}',
          snippet: _ageLabel(age),
        ),
        onTap: () => ReportDetailSheet.show(context, report),
      );
    }).toSet();
  }

  /// Map report age to a marker hue (red = very recent → grey = old).
  double _markerHue(Duration age) {
    if (age.inHours < 1) return BitmapDescriptor.hueRed;
    if (age.inHours < 6) return BitmapDescriptor.hueOrange;
    if (age.inHours < 24) return BitmapDescriptor.hueYellow;
    return BitmapDescriptor.hueAzure;
  }

  String _ageLabel(Duration age) {
    if (age.inMinutes < 60) return '${age.inMinutes}m ago';
    if (age.inHours < 24) return '${age.inHours}h ago';
    return '${age.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final reportsAsync = ref.watch(activeReportsProvider);
    final selectedFilter = ref.watch(selectedFilterProvider);
    final userProfile = ref.watch(currentUserProvider).value;

    return Scaffold(
      body: Stack(
        children: [
          // ── Google Map ───────────────────────────────────────────────────
          reportsAsync.when(
            loading: () => _buildMap(const {}, context),
            error: (e, _) => _buildMap(const {}, context),
            data: (reports) =>
                _buildMap(_buildMarkers(reports, context), context),
          ),

          // ── Offline indicator ────────────────────────────────────────────
          if (!_isOnline)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              right: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.red.shade700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.wifi_off, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Text('No internet connection',
                        style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
            ),

          // ── Filter chips ─────────────────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _FilterBar(
              selected: selectedFilter,
              onSelected: (f) =>
                  ref.read(selectedFilterProvider.notifier).state = f,
            ),
          ),

          // ── Report count badge ───────────────────────────────────────────
          reportsAsync.when(
            data: (reports) => Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              right: 16,
              child: _CountBadge(count: reports.length),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // ── Admin button (admin role only) ───────────────────────────────
          if (userProfile?.isAdmin == true)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              child: FloatingActionButton.small(
                heroTag: 'adminBtn',
                onPressed: () => context.push(AppRoutes.admin),
                tooltip: 'Admin Panel',
                child: const Icon(Icons.admin_panel_settings),
              ),
            ),

          // ── Loading shimmer over map ──────────────────────────────────────
          if (reportsAsync.isLoading)
            const Positioned(
              top: 80,
              left: 0,
              right: 0,
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),

      // ── FAB: submit report ───────────────────────────────────────────────
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 80),
        child: FloatingActionButton.extended(
          heroTag: 'reportFab',
          onPressed: () => context.push(AppRoutes.reportForm),
          icon: const Icon(Icons.add_location_alt),
          label: const Text('Report'),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildMap(Set<Marker> markers, BuildContext context) {
    return GoogleMap(
      initialCameraPosition: _initialCamera,
      markers: markers,
      myLocationEnabled: true,
      myLocationButtonEnabled: true,
      mapToolbarEnabled: false,
      onMapCreated: (ctrl) => _mapController = ctrl,
    );
  }
}

// ── Filter bar widget ─────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final TimeFilter selected;
  final ValueChanged<TimeFilter> onSelected;

  const _FilterBar({required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).colorScheme.surface.withOpacity(0.92),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: TimeFilter.values.map((f) {
          final isSelected = f == selected;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              label: Text(f.label),
              selected: isSelected,
              onSelected: (_) => onSelected(f),
              showCheckmark: false,
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Report count badge ────────────────────────────────────────────────────────

class _CountBadge extends StatelessWidget {
  final int count;

  const _CountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(blurRadius: 4, color: Colors.black26)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.pets,
              size: 14, color: theme.colorScheme.onPrimaryContainer),
          const SizedBox(width: 4),
          Text('$count',
              style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onPrimaryContainer)),
        ],
      ),
    );
  }
}
