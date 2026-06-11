"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../layout";

export default function MyBookingsPage() {
  const { user } = useDashboard();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch user bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="skeleton" style={{ height: "150px", borderRadius: "12px" }}></div>
        <div className="skeleton" style={{ height: "150px", borderRadius: "12px" }}></div>
      </div>
    );
  }

  // Filter bookings into categories
  const activeBookings = bookings.filter((b) => 
    b.status === "Approved" || b.status === "Issued" || b.status === "Overdue"
  );
  const pendingBookings = bookings.filter((b) => b.status === "Pending");
  const historicalBookings = bookings.filter((b) => 
    b.status === "Returned" || b.status === "Rejected"
  );

  const renderBookingTable = (bookingsList, title, emptyMsg) => {
    return (
      <div className="glass-card" style={{
        background: "rgba(19, 27, 46, 0.4)",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{title} ({bookingsList.length})</h3>
        
        {bookingsList.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "1.5rem 0", textAlign: "center" }}>
            {emptyMsg}
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Asset / Resource</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Requested Period</th>
                  <th>Status</th>
                  <th>Action / Details</th>
                </tr>
              </thead>
              <tbody>
                {bookingsList.map((booking) => {
                  const startStr = new Date(booking.startDate).toLocaleDateString();
                  const endStr = new Date(booking.endDate).toLocaleDateString();
                  
                  return (
                    <tr key={booking.id}>
                      <td>
                        <strong style={{ display: "block" }}>{booking.asset.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: #{booking.id}</span>
                      </td>
                      <td>{booking.asset.category.name}</td>
                      <td><strong>{booking.quantityRequested}</strong></td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          <span>{startStr}</span>
                          <span style={{ margin: "0 0.5rem", color: "var(--text-muted)" }}>➔</span>
                          <span>{endStr}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {booking.status === "Rejected" && (
                          <div style={{ fontSize: "0.8rem", color: "var(--status-rejected)" }}>
                            <span style={{ fontWeight: "600", display: "block" }}>Rejection Reason:</span>
                            <span>{booking.rejectionReason}</span>
                          </div>
                        )}
                        {booking.status === "Issued" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--status-issued)", fontWeight: "500" }}>
                            Physically checked out
                          </span>
                        )}
                        {booking.status === "Overdue" && (
                          <strong style={{ fontSize: "0.8rem", color: "var(--status-overdue)" }}>
                            ⚠️ Return Immediately!
                          </strong>
                        )}
                        {booking.status === "Approved" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--status-approved)" }}>
                            Awaiting physical pickup
                          </span>
                        )}
                        {booking.status === "Returned" && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Closed / Checked In
                          </span>
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
    );
  };

  return (
    <div>
      {/* 1. Active Reservations */}
      {renderBookingTable(
        activeBookings,
        "Active Bookings & Allocations",
        "No current active bookings or checked-out items."
      )}

      {/* 2. Pending Requests */}
      {renderBookingTable(
        pendingBookings,
        "Awaiting Administrative Review",
        "No pending booking requests."
      )}

      {/* 3. Borrowing History */}
      {renderBookingTable(
        historicalBookings,
        "Borrowing History & Archive",
        "Your borrowing archive is empty."
      )}

    </div>
  );
}
