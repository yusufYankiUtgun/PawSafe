import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/location_service.dart';
import '../../../../shared/models/report_model.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../../../map/data/report_repository.dart';

class ReportFormScreen extends ConsumerStatefulWidget {
  const ReportFormScreen({super.key});

  @override
  ConsumerState<ReportFormScreen> createState() => _ReportFormScreenState();
}

class _ReportFormScreenState extends ConsumerState<ReportFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descCtrl = TextEditingController();
  final _locationSvc = LocationService();
  final _imagePicker = ImagePicker();

  bool _loading = false;
  bool _locating = true;
  String? _errorMessage;

  LatLng? _position;
  String _district = 'Unknown Area';
  File? _selectedImage;

  @override
  void initState() {
    super.initState();
    _fetchLocation();
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchLocation() async {
    setState(() => _locating = true);
    try {
      final pos = await _locationSvc.getCurrentPosition();
      final latLng = LatLng(pos.latitude, pos.longitude);
      final district = await _locationSvc.getAreaName(latLng);
      if (mounted) {
        setState(() {
          _position = latLng;
          _district = district;
          _locating = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _locating = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (picked == null) return;

      final file = File(picked.path);
      final bytes = await file.length();
      if (bytes > AppConstants.maxPhotoBytes) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Photo must be smaller than 5 MB.')),
          );
        }
        return;
      }
      if (mounted) setState(() => _selectedImage = file);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not select image: $e')),
        );
      }
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take a photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_position == null) {
      setState(() =>
          _errorMessage = 'Location not available. Tap "Retry" to try again.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final draft = ReportDraft(
        location: GeoPoint(_position!.latitude, _position!.longitude),
        description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        localImagePath: _selectedImage?.path,
        district: _district,
      );

      await ref.read(reportRepositoryProvider).submitReport(draft);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report submitted! Thank you for keeping your community safe.'),
            backgroundColor: Color(0xFF2E7D32),
          ),
        );
        context.pop();
      }
    } on RateLimitException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (e) {
      setState(() =>
          _errorMessage = 'Failed to submit report. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Report Stray Dog')),
      body: LoadingOverlay(
        isLoading: _loading,
        message: 'Submitting report...',
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Location card ────────────────────────────────────────────
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.location_on,
                                color: theme.colorScheme.primary),
                            const SizedBox(width: 8),
                            Text('Location',
                                style: theme.textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (_locating)
                          const Row(
                            children: [
                              SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2)),
                              SizedBox(width: 8),
                              Text('Getting your location…'),
                            ],
                          )
                        else if (_position != null)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Mini map preview
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: SizedBox(
                                  height: 140,
                                  child: GoogleMap(
                                    initialCameraPosition: CameraPosition(
                                      target: _position!,
                                      zoom: 16,
                                    ),
                                    markers: {
                                      Marker(
                                        markerId:
                                            const MarkerId('current'),
                                        position: _position!,
                                      ),
                                    },
                                    zoomControlsEnabled: false,
                                    scrollGesturesEnabled: false,
                                    tiltGesturesEnabled: false,
                                    rotateGesturesEnabled: false,
                                    myLocationButtonEnabled: false,
                                    mapToolbarEnabled: false,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _district,
                                style: theme.textTheme.bodyMedium,
                              ),
                              Text(
                                '${_position!.latitude.toStringAsFixed(5)}, '
                                '${_position!.longitude.toStringAsFixed(5)}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                    color:
                                        theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
                          )
                        else
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _errorMessage ?? 'Location unavailable.',
                                style: TextStyle(
                                    color: theme.colorScheme.error),
                              ),
                              const SizedBox(height: 8),
                              OutlinedButton.icon(
                                onPressed: _fetchLocation,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Retry'),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // ── Description ──────────────────────────────────────────────
                TextFormField(
                  controller: _descCtrl,
                  maxLines: 3,
                  maxLength: AppConstants.maxDescriptionLength,
                  textInputAction: TextInputAction.done,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                    hintText: 'e.g. Large brown dog near playground',
                    prefixIcon: Icon(Icons.notes_outlined),
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 16),

                // ── Photo ────────────────────────────────────────────────────
                Text('Photo (optional)',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (_selectedImage != null) ...[
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _selectedImage!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: IconButton.filled(
                          icon: const Icon(Icons.close),
                          onPressed: () =>
                              setState(() => _selectedImage = null),
                          style: IconButton.styleFrom(
                              backgroundColor:
                                  Colors.black54),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                OutlinedButton.icon(
                  onPressed: _showImageSourceSheet,
                  icon: Icon(_selectedImage == null
                      ? Icons.add_photo_alternate_outlined
                      : Icons.swap_horiz),
                  label: Text(_selectedImage == null
                      ? 'Add Photo'
                      : 'Change Photo'),
                ),

                // ── Error ────────────────────────────────────────────────────
                if (_errorMessage != null &&
                    _position != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(_errorMessage!,
                        style: TextStyle(
                            color: theme.colorScheme.error)),
                  ),
                ],
                const SizedBox(height: 24),

                // ── Submit button ────────────────────────────────────────────
                FilledButton.icon(
                  onPressed:
                      (_loading || _locating) ? null : _submit,
                  icon: const Icon(Icons.send),
                  label: const Text('Submit Report'),
                ),
                const SizedBox(height: 8),
                Text(
                  'Max ${AppConstants.maxReportsPerHour} reports per hour.',
                  style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
