import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/services/notification_service.dart';
import '../../../../features/auth/data/auth_repository.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/widgets/loading_overlay.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _nameCtrl = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  void _initFromUser(UserModel user) {
    if (!_initialized) {
      _nameCtrl.text = user.displayName;
      _initialized = true;
    }
  }

  Future<void> _saveDisplayName(UserModel user) async {
    final newName = _nameCtrl.text.trim();
    if (newName.isEmpty || newName == user.displayName) return;

    setState(() => _saving = true);
    try {
      await FirebaseFirestore.instance
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .update({'displayName': newName});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Display name updated.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggleNotifications(UserModel user, bool value) async {
    try {
      await FirebaseFirestore.instance
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .update({'notificationsEnabled': value});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _updateRadius(UserModel user, int radius) async {
    try {
      await FirebaseFirestore.instance
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .update({'notificationRadius': radius});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await NotificationService().clearToken();
      await ref.read(authRepositoryProvider).signOut();
      if (mounted) context.go(AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(currentUserProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: userAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) =>
            Center(child: Text('Error loading profile: $e')),
        data: (user) {
          if (user == null) {
            return const Center(child: Text('Not logged in.'));
          }
          _initFromUser(user);

          return LoadingOverlay(
            isLoading: _saving,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // ── Profile section ──────────────────────────────────────────
                _SectionHeader(title: 'Profile'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor:
                                  theme.colorScheme.primaryContainer,
                              child: Text(
                                user.displayName.isNotEmpty
                                    ? user.displayName[0].toUpperCase()
                                    : '?',
                                style: theme.textTheme.titleLarge
                                    ?.copyWith(
                                  color: theme
                                      .colorScheme.onPrimaryContainer,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(user.displayName,
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(
                                              fontWeight:
                                                  FontWeight.bold)),
                                  Text(user.email,
                                      style:
                                          theme.textTheme.bodySmall),
                                  if (user.isAdmin)
                                    Container(
                                      margin: const EdgeInsets.only(
                                          top: 4),
                                      padding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 2),
                                      decoration: BoxDecoration(
                                        color: theme
                                            .colorScheme.primaryContainer,
                                        borderRadius:
                                            BorderRadius.circular(8),
                                      ),
                                      child: Text('Admin',
                                          style: TextStyle(
                                              fontSize: 11,
                                              fontWeight:
                                                  FontWeight.bold,
                                              color: theme.colorScheme
                                                  .onPrimaryContainer)),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _nameCtrl,
                          textCapitalization:
                              TextCapitalization.words,
                          decoration: InputDecoration(
                            labelText: 'Display Name',
                            prefixIcon:
                                const Icon(Icons.person_outlined),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.save_outlined),
                              tooltip: 'Save',
                              onPressed: () =>
                                  _saveDisplayName(user),
                            ),
                          ),
                          onFieldSubmitted: (_) =>
                              _saveDisplayName(user),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // ── Notifications section ────────────────────────────────────
                _SectionHeader(title: 'Notifications'),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        title:
                            const Text('Enable push notifications'),
                        subtitle: const Text(
                            'Get alerts for stray dogs near you'),
                        value: user.notificationsEnabled,
                        onChanged: (val) =>
                            _toggleNotifications(user, val),
                      ),
                      if (user.notificationsEnabled)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                              16, 0, 16, 16),
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              const Divider(),
                              Text(
                                'Notification Radius: ${user.notificationRadius}m',
                                style:
                                    theme.textTheme.titleSmall,
                              ),
                              Slider(
                                value: user.notificationRadius
                                    .toDouble(),
                                min: 250,
                                max: 5000,
                                divisions: 19,
                                label: '${user.notificationRadius}m',
                                onChanged: (val) =>
                                    _updateRadius(
                                        user, val.round()),
                              ),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('250m',
                                      style: theme
                                          .textTheme.labelSmall),
                                  Text('5000m',
                                      style: theme
                                          .textTheme.labelSmall),
                                ],
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── Admin section ────────────────────────────────────────────
                if (user.isAdmin) ...[
                  _SectionHeader(title: 'Admin'),
                  Card(
                    child: ListTile(
                      leading: const Icon(
                          Icons.admin_panel_settings_outlined),
                      title: const Text('Admin Dashboard'),
                      subtitle: const Text(
                          'Manage and moderate reports'),
                      trailing: const Icon(
                          Icons.arrow_forward_ios, size: 16),
                      onTap: () => context.push(AppRoutes.admin),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Danger zone ──────────────────────────────────────────────
                _SectionHeader(title: 'Account'),
                Card(
                  child: ListTile(
                    leading: Icon(Icons.logout,
                        color: theme.colorScheme.error),
                    title: Text('Sign Out',
                        style: TextStyle(
                            color: theme.colorScheme.error)),
                    onTap: _signOut,
                  ),
                ),

                const SizedBox(height: 24),
                Center(
                  child: Text('PawSafe v1.0.0',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(
                              color: theme
                                  .colorScheme.onSurfaceVariant)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }
}
