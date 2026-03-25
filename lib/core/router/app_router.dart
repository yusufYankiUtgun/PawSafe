import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/admin/presentation/screens/admin_dashboard_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/map/presentation/screens/map_screen.dart';
import '../../features/reporting/presentation/screens/report_form_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../shared/widgets/scaffold_with_nav_bar.dart';

// ── Route paths ───────────────────────────────────────────────────────────────
class AppRoutes {
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const home = '/';
  static const map = '/map';
  static const reportForm = '/report';
  static const analytics = '/analytics';
  static const settings = '/settings';
  static const admin = '/admin';
}

// ── Shell navigation keys ─────────────────────────────────────────────────────
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(firebaseAuthProvider);
  final userProfile = ref.watch(currentUserProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.home,
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isAuthRoute = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.register ||
          state.matchedLocation == AppRoutes.forgotPassword;

      if (!isLoggedIn) {
        return isAuthRoute ? null : AppRoutes.login;
      }

      // Redirect away from auth screens when logged in.
      if (isAuthRoute) return AppRoutes.map;

      // Admin-only route guard.
      if (state.matchedLocation == AppRoutes.admin) {
        final isAdmin = userProfile.value?.isAdmin ?? false;
        if (!isAdmin) return AppRoutes.map;
      }

      return null;
    },
    routes: [
      // ── Auth screens ──────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (_, __) => const ForgotPasswordScreen(),
      ),

      // ── Main app shell with bottom nav ────────────────────────────────────
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) =>
            ScaffoldWithNavBar(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.map,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: MapScreen()),
          ),
          GoRoute(
            path: AppRoutes.analytics,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: AnalyticsScreen()),
          ),
          GoRoute(
            path: AppRoutes.settings,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: SettingsScreen()),
          ),
        ],
      ),

      // ── Full-screen routes ────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.home,
        redirect: (_, __) => AppRoutes.map,
      ),
      GoRoute(
        path: AppRoutes.reportForm,
        builder: (_, __) => const ReportFormScreen(),
      ),
      GoRoute(
        path: AppRoutes.admin,
        builder: (_, __) => const AdminDashboardScreen(),
      ),
    ],
  );
});
