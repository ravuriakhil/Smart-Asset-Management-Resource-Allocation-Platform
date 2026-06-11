"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister 
      ? formData 
      : { email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      // Success: redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      overflow: "hidden",
      padding: "2rem"
    }}>
      {/* Background glowing decorations */}
      <div className="glow-accent" style={{ top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(0,0,0,0) 70%)" }}></div>
      <div className="glow-accent" style={{ bottom: "-10%", right: "-10%", background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(0,0,0,0) 70%)" }}></div>

      <div className="glass-card" style={{
        width: "100%",
        maxWidth: "440px",
        zIndex: 1,
        borderRadius: "var(--radius-lg)",
        padding: "2.5rem 2rem",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)"
      }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            color: "#fff",
            fontSize: "1.5rem",
            fontWeight: "700",
            fontFamily: "var(--font-display)",
            marginBottom: "1rem",
            boxShadow: "0 0 20px var(--primary-glow)"
          }}>
            Ω
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.25rem" }}>
            Smart Asset
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Resource Allocation & Tracking Platform
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: "flex",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "4px",
          borderRadius: "var(--radius-sm)",
          marginBottom: "1.5rem",
          border: "1px solid var(--border-color)"
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "6px",
              border: "none",
              background: !isRegister ? "var(--bg-secondary)" : "transparent",
              color: !isRegister ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "var(--transition)"
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "6px",
              border: "none",
              background: isRegister ? "var(--bg-secondary)" : "transparent",
              color: isRegister ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "var(--transition)"
            }}
          >
            Register
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--status-rejected)",
            fontSize: "0.875rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.25rem",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">Select User Role</label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">Resource Consumer (User)</option>
                <option value="admin">Administrator (Admin)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", marginTop: "1rem", height: "46px" }}
          >
            {loading ? (
              <div className="skeleton" style={{ width: "24px", height: "24px", borderRadius: "50%" }}></div>
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            By continuing, you agree to organization security guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
