import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, borderRadius: 8, border: "1px solid #e5e7eb",
  padding: "0 14px", fontSize: 14, color: "#111", outline: "none",
  background: "white", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 6, display: "block",
};

export const BorrowerLoginPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/portal";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      navigate(redirect);
    } else {
      if (!fullName.trim()) { setError("Full name is required"); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName, "borrower");
      if (error) { setError(error); setLoading(false); return; }
      setLoading(false);
      setSuccess("Check your email for a verification link, then sign in.");
      setMode("login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>Diagon</h1>
          </Link>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>
            {mode === "login" ? "Sign in to your borrower portal" : "Create your borrower account"}
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: "white", borderRadius: 12, border: "1px solid #e5e7eb",
          padding: 28, display: "flex", flexDirection: "column", gap: 16,
        }}>
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com" required style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#111")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", borderRadius: 8, padding: "8px 12px" }}>{error}</p>
          )}
          {success && (
            <p style={{ fontSize: 13, color: "#16a34a", background: "#f0fdf4", borderRadius: 8, padding: "8px 12px" }}>{success}</p>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", height: 42, borderRadius: 8, background: "#3b82f6", color: "white",
            border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
            opacity: loading ? 0.5 : 1, fontFamily: "inherit",
          }}>
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 20 }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(null); }}
                style={{ color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(null); }}
                style={{ color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
