import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class ReportModel {
  final String id;
  final String uid;
  final GeoPoint location;
  final DateTime timestamp;
  final String? description;
  final String? photoUrl;
  final bool deleted;
  final String district; // reverse-geocoded area or coordinate fallback

  const ReportModel({
    required this.id,
    required this.uid,
    required this.location,
    required this.timestamp,
    this.description,
    this.photoUrl,
    this.deleted = false,
    this.district = 'Unknown Area',
  });

  LatLng get latLng => LatLng(location.latitude, location.longitude);

  factory ReportModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ReportModel(
      id: doc.id,
      uid: data['uid'] as String? ?? '',
      location: data['location'] as GeoPoint,
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      description: data['description'] as String?,
      photoUrl: data['photoUrl'] as String?,
      deleted: data['deleted'] as bool? ?? false,
      district: data['district'] as String? ?? 'Unknown Area',
    );
  }

  Map<String, dynamic> toFirestore() => {
        'uid': uid,
        'location': location,
        'timestamp': Timestamp.fromDate(timestamp),
        if (description != null && description!.isNotEmpty)
          'description': description,
        if (photoUrl != null) 'photoUrl': photoUrl,
        'deleted': deleted,
        'district': district,
      };
}

/// Represents a pending report before it is written to Firestore.
class ReportDraft {
  final GeoPoint location;
  final String? description;
  final String? localImagePath; // local file path before upload
  final String district;

  const ReportDraft({
    required this.location,
    this.description,
    this.localImagePath,
    this.district = 'Unknown Area',
  });
}
