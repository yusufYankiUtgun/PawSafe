import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationService {
  /// Requests permission and returns the device's current position.
  /// Throws a [LocationException] with a descriptive message on failure.
  Future<Position> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationException('Location services are disabled. Please enable GPS.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw LocationException('Location permission was denied.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw LocationException(
        'Location permission is permanently denied. '
        'Please enable it in device settings.',
      );
    }

    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  /// Returns a human-readable area name for the given [latLng].
  /// Falls back to coordinate string if reverse geocoding fails.
  Future<String> getAreaName(LatLng latLng) async {
    try {
      final placemarks = await placemarkFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = [
          p.subLocality,
          p.locality,
          p.administrativeArea,
        ].where((s) => s != null && s.isNotEmpty).toList();
        if (parts.isNotEmpty) return parts.first!;
      }
    } catch (_) {
      // Geocoding failed – fall back to coordinates
    }
    return _coordLabel(latLng);
  }

  /// Returns the approximate street address for the given [latLng].
  Future<String> getAddress(LatLng latLng) async {
    try {
      final placemarks = await placemarkFromCoordinates(
        latLng.latitude,
        latLng.longitude,
      );
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = [
          p.street,
          p.subLocality,
          p.locality,
        ].where((s) => s != null && s.isNotEmpty).toList();
        if (parts.isNotEmpty) return parts.join(', ');
      }
    } catch (_) {
      // Geocoding failed – fall back to coordinates
    }
    return _coordLabel(latLng);
  }

  String _coordLabel(LatLng latLng) =>
      '${latLng.latitude.toStringAsFixed(4)}, ${latLng.longitude.toStringAsFixed(4)}';
}

class LocationException implements Exception {
  final String message;
  const LocationException(this.message);

  @override
  String toString() => message;
}
