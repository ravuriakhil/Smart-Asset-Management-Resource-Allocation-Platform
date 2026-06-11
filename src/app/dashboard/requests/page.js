"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../layout";

export default function RequestsQueuePage() {
  const { user } = useDashboard();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores booking ID currently processing
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reject Modal
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings?status=Pending");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchRequests();
    }
  }, [user]);

  const handleApprove = async (id) => {
    setErrorMsg("");
    setSuccessMsg("");
    setActionLoading(id);

    try {
      const res = await fetch(`/api/bookings/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve booking request");
      }

      setSuccessMsg(`Booking #${id} approved successfully!`);
      fetchRequests();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (booking) => {
    setRejectingBooking(booking);
    setRejectionReason("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const closeRejectModal = () => {
    setRejectingBooking(null);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    const id = rejectingBooking.id;
    setActionLoading(id);
    closeRejectModal();

    try {
      const res = await fetch(`/api/bookings/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject booking request");
      }

      setSuccessMsg(`Booking #${id} rejected.`);
      fetchRequests();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }}></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Alert Banners */}
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

      {/* Main Table */}
      <div className="glass-card" style={{ background: "rgba(19, 27, 46, 0.4)", padding: "1.5rem" }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <span style={{ fontSize: "2.5rem" }}>📥</span>
            <h3 style={{ fontSize: "1.1rem", marginTop: "1rem" }}>Queue is Empty</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              All booking requests have been processed.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Applicant</th>
                  <th>Resource Requested</th>
                  <th>Quantity</th>
                  <th>Usage Date Range</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((booking) => {
                  const startStr = new Date(booking.startDate).toLocaleDateString();
                  const endStr = new Date(booking.endDate).toLocaleDateString();
                  const isProcessing = actionLoading === booking.id;
                  
                  return (
                    <tr key={booking.id}>
                      <td><strong>#{booking.id}</strong></td>
                      <td>
                        <strong style={{ display: "block" }}>{booking.user.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{booking.user.email}</span>
                      </td>
                      <td>
                        <strong style={{ display: "block" }}>{booking.asset.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Category: {booking.asset.category.name}</span>
                      </td>
                      <td>
                        <strong>{booking.quantityRequested}</strong>
                        <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          ({booking.asset.availableQuantity} available in pool)
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          <span>{startStr}</span>
                          <span style={{ margin: "0 0.4rem", color: "var(--text-muted)" }}>➔</span>
                          <span>{endStr}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="btn btn-success"
                            disabled={isProcessing}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(booking)}
                            className="btn btn-danger"
                            disabled={isProcessing}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(3, 7, 18, 0.8)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "1.5rem"
        }} onClick={closeRejectModal}>
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--bg-secondary)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Reject Booking Request #{rejectingBooking.id}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Are you sure you want to reject the booking request from <strong>{rejectingBooking.user.name}</strong> for <strong>{rejectingBooking.asset.name}</strong>?
            </p>

            <form onSubmit={handleReject}>
              <div className="form-group">
                <label className="form-label" htmlFor="reason">Reason for Rejection</label>
                <textarea
                  id="reason"
                  className="form-textarea"
                  placeholder="Specify why the request is rejected (e.g. maintenance, inventory reserved for council event)..."
                  required
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRejectModal}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: "var(--status-rejected)" }}
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
