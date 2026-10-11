// src/pages/LoginPage.jsx
// Auth removed — redirects straight to the app with no login required.

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    navigate(from, { replace: true });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16, color: "var(--text-2)", fontFamily: "var(--font)"
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24
      }}>🌿</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Loading FocusOS…</div>
      <div className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  );
}
