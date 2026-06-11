"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../layout";

export default function ActiveAllocationsPage() {
  const { user } = useDashboard();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filterTab, setFilterTab] = useState("approved"); // approved | issued

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        // Keep Approved, Issued, and Overdue bookings
        const filtered = data.bookings.filter(b => 
          b.status === "Approved" || b.status === "Issued" || b.status === "Overdue"
        );
        setAllocations(filtered || []);
      }
    } catch (error) {
      console.error("Failed to fetch allocations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAllocations();
    }
  }, [user]);

  const handleIssue = async (id) => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(id);

    try {
      const res = await fetch(`/api/bookings/${id}/issue`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to mark booking as issued");
      setSuccessMsg(`Asset for Booking #${id} marked as Issued.`);
      fetchAllocations();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (id) => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(id);

    try {
      const res = await fetch(`/api/bookings/${id}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to process return");
      setSuccessMsg(`Asset for Booking #${id} checked in. Stock replenished!`);
      fetchAllocations();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }}></div>;
  }

  // Split items
  const awaitingPickup = allocations.filter(a => a.status === "Approved");
  const checkedOut = allocations.filter(a => a.status === "Issued" || a.status === "Overdue");
  const activeList = filterTab === "approved" ? awaitingPickup : checkedOut;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Alert Callouts */}
      {errorMsg && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "var(--status-rejected)",
          fontSize: "0.9rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-sm)",
          fontWeight: "500"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          color: "var(--status-issued)",
          fontSize: "0.9rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-sm)",
          fontWeight: "500"
        }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Segment Selector Tabs */}
      <div style={{
        display: "flex",
        background: "rgba(15, 23, 42, 0.4)",
        padding: "4px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-color)",
        width: "fit-content"
      }}>
        <button
          onClick={() => setFilterTab("approved")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            background: filterTab === "approved" ? "rgba(139, 92, 246, 0.15)" : "transparent",
            color: filterTab === "approved" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "var(--transition)"
          }}
        >
          Awaiting Pickup ({awaitingPickup.length})
        </button>
        <button
          onClick={() => setFilterTab("issued")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            background: filterTab === "issued" ? "rgba(139, 92, 246, 0.15)" : "transparent",
            color: filterTab === "issued" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: "600",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "var(--transition)"
          }}
        >
          Checked Out / On Loan ({checkedOut.length})
        </button>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ background: "rgba(19, 27, 46, 0.4)", padding: "1.5rem" }}>
        {activeList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <span style={{ fontSize: "2.5rem" }}>📋</span>
            <h3 style={{ fontSize: "1.1rem", marginTop: "1rem" }}>No allocations in this category</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              There are no current allocations matching this filter.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Borrower</th>
                  <th>Resource</th>
                  <th>Quantity</th>
                  <th>Return Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Handover Action</th>
                </tr>
              </thead>
              <tbody>
                {activeList.map((alloc) => {
                  const dueStr = new Date(alloc.dueDate).toLocaleDateString();
                  const isProcessing = actionLoading === alloc.id;
                  
                  return (
                    <tr key={alloc.id}>
                      <td><strong>#{alloc.id}</strong></td>
                      <td>
                        <strong style={{ display: "block" }}>{alloc.user.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alloc.user.email}</span>
                      </td>
                      <td>
                        <strong style={{ display: "block" }}>{alloc.asset.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Category: {alloc.asset.category.name}</span>
                      </td>
                      <td><strong>{alloc.quantityRequested}</strong></td>
                      <td><strong>{dueStr}</strong></td>
                      <td>
                        <span className={`badge badge-${alloc.status.toLowerCase()}`}>
                          {alloc.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {alloc.status === "Approved" ? (
                          <button
                            onClick={() => handleIssue(alloc.id)}
                            className="btn btn-success"
                            disabled={isProcessing}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          >
                            {isProcessing ? "Issuing..." : "Mark as Issued"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReturn(alloc.id)}
                            className="btn btn-primary"
                            disabled={isProcessing}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "rgba(139, 92, 246, 0.2)", border: "1px solid var(--primary)", color: "var(--text-primary)" }}
                          >
                            {isProcessing ? "Checking In..." : "Check In (Return)"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
