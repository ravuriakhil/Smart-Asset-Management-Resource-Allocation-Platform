"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../layout";

export default function AssetCatalogPage() {
  const { fetchNotifications } = useDashboard();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [bookingQty, setBookingQty] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (availableOnly) params.append("available", "true");

      const res = await fetch(`/api/assets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAssets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, availableOnly]);

  // Handle open modal
  const openBookingModal = (asset) => {
    setSelectedAsset(asset);
    setBookingQty(1);
    setBookingError("");
    setBookingSuccess("");
    
    // Set default dates: today & tomorrow
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    setStartDate(today.toISOString().split("T")[0]);
    setEndDate(tomorrow.toISOString().split("T")[0]);
  };

  const closeBookingModal = () => {
    setSelectedAsset(null);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess("");
    setBookingLoading(true);

    if (bookingQty <= 0) {
      setBookingError("Quantity must be at least 1");
      setBookingLoading(false);
      return;
    }
    if (bookingQty > selectedAsset.availableQuantity) {
      setBookingError(`Requested quantity exceeds available stock (${selectedAsset.availableQuantity})`);
      setBookingLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          quantityRequested: bookingQty,
          startDate,
          endDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit booking");
      }

      setBookingSuccess("Your booking request has been submitted and is pending admin approval!");
      fetchAssets(); // Refresh stock metrics
      fetchNotifications(); // Update notification bell in header

      setTimeout(() => {
        closeBookingModal();
      }, 2000);
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Search & Filter Bar */}
      <div className="glass-card" style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.25rem",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(19, 27, 46, 0.4)",
        padding: "1.25rem"
      }}>
        <div style={{ display: "flex", flex: 1, minWidth: "260px", gap: "1rem" }}>
          {/* Search box */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Search assets by name or description..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
            <span style={{ position: "absolute", left: "0.95rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              🔍
            </span>
          </div>

          {/* Category Dropdown */}
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Availability Toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          userSelect: "none"
        }}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              accentColor: "var(--primary)",
              cursor: "pointer"
            }}
          />
          <span>Show available stock only</span>
        </label>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem"
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: "240px", borderRadius: "12px" }}></div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(19, 27, 46, 0.2)" }}>
          <span style={{ fontSize: "3rem" }}>📦</span>
          <h3 style={{ marginTop: "1rem", fontSize: "1.25rem" }}>No Assets Found</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Adjust your search or filters to see available organizational equipment.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem"
        }}>
          {assets.map((asset) => {
            const isOutOfStock = asset.availableQuantity === 0;
            const statusClass = isOutOfStock ? "rejected" : asset.status === "Under Maintenance" ? "overdue" : "issued";
            
            return (
              <div
                key={asset.id}
                className="glass-card"
                onClick={() => openBookingModal(asset)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
              >
                <div>
                  {/* Category Tag */}
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    {asset.category.name}
                  </span>

                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: "0.25rem 0 0.5rem 0" }}>
                    {asset.name}
                  </h3>

                  <p style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: "3.75rem",
                    marginBottom: "1rem"
                  }}>
                    {asset.description || "No description provided."}
                  </p>
                </div>

                {/* Stock Gauge */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontWeight: "500" }}>Stock</span>
                    <strong style={{ fontSize: "0.95rem" }}>
                      {asset.availableQuantity} <span style={{ fontWeight: "400", color: "var(--text-muted)" }}>/ {asset.totalQuantity} available</span>
                    </strong>
                  </div>
                  <span className={`badge badge-${statusClass}`} style={{ fontSize: "0.65rem" }}>
                    {isOutOfStock ? "Out of Stock" : asset.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedAsset && (
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
        }} onClick={closeBookingModal}>
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-secondary)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "var(--shadow-lg)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--primary)", textTransform: "uppercase" }}>
                  {selectedAsset.category.name}
                </span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginTop: "0.25rem" }}>{selectedAsset.name}</h2>
              </div>
              <button
                onClick={closeBookingModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  color: "var(--text-muted)"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              {selectedAsset.description || "No description provided."}
            </p>

            <div style={{
              background: "rgba(15, 23, 42, 0.4)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              border: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "1.5rem"
            }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Available Stock</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--status-issued)" }}>{selectedAsset.availableQuantity} units</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Total Pool</span>
                <strong style={{ fontSize: "1.2rem" }}>{selectedAsset.totalQuantity} units</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Condition</span>
                <strong style={{ fontSize: "1.2rem", color: "var(--primary)" }}>{selectedAsset.status}</strong>
              </div>
            </div>

            {/* Notifications inside modal */}
            {bookingError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--status-rejected)",
                fontSize: "0.85rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1rem",
                fontWeight: "500"
              }}>
                ⚠️ {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "var(--status-issued)",
                fontSize: "0.85rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "1rem",
                fontWeight: "500"
              }}>
                ✅ {bookingSuccess}
              </div>
            )}

            {/* Booking Form */}
            {selectedAsset.availableQuantity > 0 && selectedAsset.status === "Available" ? (
              <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      className="form-input"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="endDate">End Date (Due Return)</label>
                    <input
                      id="endDate"
                      type="date"
                      className="form-input"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="qty">Quantity Requested</label>
                  <input
                    id="qty"
                    type="number"
                    min="1"
                    max={selectedAsset.availableQuantity}
                    className="form-input"
                    required
                    value={bookingQty}
                    onChange={(e) => setBookingQty(parseInt(e.target.value) || "")}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeBookingModal}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={bookingLoading || bookingSuccess}
                    style={{ flex: 2 }}
                  >
                    {bookingLoading ? "Submitting..." : "Submit Booking Request"}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{
                  textAlign: "center",
                  padding: "1.5rem",
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px dashed rgba(239, 68, 68, 0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem"
                }}>
                  This asset is currently out of stock or unavailable for booking.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBookingModal}
                  style={{ width: "100%", marginTop: "1.5rem" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
