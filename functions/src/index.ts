import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

// ─── Collection names ─────────────────────────────────────────────────────────
const REPORTS = "reports";
const USERS = "users";
const AUDIT_LOG = "audit_log";

// ─────────────────────────────────────────────────────────────────────────────
// 1. deleteReportAdmin
//    Admin-only callable function. Soft-deletes a report and writes audit log.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteReportAdmin = functions.https.onCall(
  async (data: { reportId: string }, context) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in."
      );
    }

    // Admin role check
    const adminDoc = await db.collection(USERS).doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin role required."
      );
    }

    const { reportId } = data;
    if (!reportId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "reportId is required."
      );
    }

    const reportRef = db.collection(REPORTS).doc(reportId);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Report not found."
      );
    }

    const batch = db.batch();

    // Soft delete
    batch.update(reportRef, { deleted: true });

    // Audit log
    const auditRef = db.collection(AUDIT_LOG).doc();
    batch.set(auditRef, {
      adminUid: context.auth.uid,
      reportId,
      action: "delete",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    functions.logger.info(`Report ${reportId} deleted by admin ${context.auth.uid}`);
    return { success: true };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. getAreaAnalytics
//    Returns report counts per area and daily counts for the past 7 days.
//    Callable by any authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export const getAreaAnalytics = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in."
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeSnap = await db
      .collection(REPORTS)
      .where("deleted", "==", false)
      .get();

    const areaMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    // Pre-fill last 7 days with zeros
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap[dateKey(d)] = 0;
    }

    activeSnap.forEach((doc) => {
      const data = doc.data();
      const district: string = data.district ?? "Unknown Area";
      const ts: admin.firestore.Timestamp = data.timestamp;
      const date = ts.toDate();

      areaMap[district] = (areaMap[district] ?? 0) + 1;

      if (date >= sevenDaysAgo) {
        const key = dateKey(date);
        if (dailyMap[key] !== undefined) {
          dailyMap[key]++;
        }
      }
    });

    const areaCounts = Object.entries(areaMap)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dailyCounts = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalActive: activeSnap.size,
      areaCounts,
      dailyCounts,
    };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. onReportCreated
//    Firestore trigger. Fires when a new report document is created.
//    Sends FCM push notifications to users who have notifications enabled
//    and whose home location is within their configured radius.
//
//    MVP SIMPLIFICATION:
//    Full geospatial radius queries are not supported natively in Firestore.
//    This MVP sends a notification to ALL users who have:
//      - notificationsEnabled == true
//      - a valid fcmToken
//    A comment marks where radius filtering should be added in production.
// ─────────────────────────────────────────────────────────────────────────────
export const onReportCreated = functions.firestore
  .document(`${REPORTS}/{reportId}`)
  .onCreate(async (snap, context) => {
    const report = snap.data();
    const reportId = context.params.reportId;

    functions.logger.info(`New report created: ${reportId}`);

    // Fetch users with notifications enabled and a valid FCM token.
    const usersSnap = await db
      .collection(USERS)
      .where("notificationsEnabled", "==", true)
      .get();

    const tokens: string[] = [];
    usersSnap.forEach((doc) => {
      const user = doc.data();
      // Skip the reporter themselves.
      if (doc.id === report.uid) return;
      if (user.fcmToken && typeof user.fcmToken === "string") {
        // ── PRODUCTION TODO ───────────────────────────────────────────────
        // Add geospatial distance check here:
        //   const dist = haversineDistance(user.homeLocation, report.location);
        //   if (dist <= user.notificationRadius) tokens.push(user.fcmToken);
        // ─────────────────────────────────────────────────────────────────
        tokens.push(user.fcmToken);
      }
    });

    if (tokens.length === 0) {
      functions.logger.info("No eligible notification recipients.");
      return;
    }

    const district: string = report.district ?? "your area";

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: "⚠️ Stray Dog Nearby",
        body: `A stray dog was reported in ${district}. Stay aware.`,
      },
      data: {
        reportId,
        district,
        latitude: String(report.location._latitude ?? 0),
        longitude: String(report.location._longitude ?? 0),
        type: "new_report",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "pawsafe_alerts",
          icon: "ic_notification",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      functions.logger.info(
        `Notifications sent: ${response.successCount} success, ` +
          `${response.failureCount} failure.`
      );
    } catch (err) {
      functions.logger.error("FCM send error:", err);
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
