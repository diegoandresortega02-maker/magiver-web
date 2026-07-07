import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { config } from "@/lib/config";
import {
  getPendingVerifications, getActiveProfessionals, getRejectedProfessionals, getAdminStats,
} from "@/lib/api";
import type { PendingVerification, ProUser as ApiProUser, AdminStats } from "@/lib/types";
import { AdminAuth, AdminDashboard, AdminProReview } from "./AdminAuthDashboard";

// ─── PAGE: Admin portal (/admin) ──────────────────────────────────────────────
type AS = "auth" | "dashboard" | "review";

export function AdminPortal() {
  const navigate = useNavigate();

  const [screen, setScreen] = useState<AS>("auth");
  const [reviewingRecord, setReviewingRecord] = useState<PendingVerification | null>(null);
  const [pendingList, setPendingList] = useState<PendingVerification[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activeList, setActiveList] = useState<ApiProUser[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [rejectedList, setRejectedList] = useState<ApiProUser[]>([]);
  const [loadingRejected, setLoadingRejected] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const refreshDashboard = async () => {
    if (config.MOCK_MODE) return;
    setLoadingPending(true); setLoadingActive(true); setLoadingRejected(true);
    try {
      const [pending, active, rejected, stats] = await Promise.all([
        getPendingVerifications(), getActiveProfessionals(), getRejectedProfessionals(), getAdminStats(),
      ]);
      setPendingList(pending.data);
      setActiveList(active);
      setRejectedList(rejected);
      setAdminStats(stats);
    } catch {
      setPendingList([]); setActiveList([]); setRejectedList([]);
    } finally {
      setLoadingPending(false); setLoadingActive(false); setLoadingRejected(false);
    }
  };

  useEffect(() => { if (screen === "dashboard") refreshDashboard(); }, [screen]);

  if (screen === "auth") return <AdminAuth onLogin={() => setScreen("dashboard")} onBack={() => navigate("/")} />;
  if (screen === "dashboard") return <AdminDashboard pendingList={pendingList} loadingPending={loadingPending} activeList={activeList} loadingActive={loadingActive} rejectedList={rejectedList} loadingRejected={loadingRejected} adminStats={adminStats} onReview={rec => { setReviewingRecord(rec); setScreen("review"); }} onLogout={() => navigate("/")} />;
  if (screen === "review") return <AdminProReview record={reviewingRecord!} onDone={() => setScreen("dashboard")} onBack={() => setScreen("dashboard")} />;
  return null;
}
