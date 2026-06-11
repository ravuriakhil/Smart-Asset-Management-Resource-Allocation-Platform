"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../layout";

export default function InventoryCRUDPage() {
  const { user } = useDashboard();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null); // null if adding
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    totalQuantity: 1,
    status: "Available"
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/assets");
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
    if (user && user.role === "admin") {
      fetchAssets();
      fetchCategories();
    }
  }, [user]);

  const openAddModal = () => {
    setEditingAsset(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      description: "",
      totalQuantity: 1,
      status: "Available"
    });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      categoryId: asset.categoryId,
      description: asset.description || "",
      totalQuantity: asset.totalQuantity,
      status: asset.status
    });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setModalLoading(true);

    const isEdit = !!editingAsset;
    const endpoint = isEdit ? `/api/assets/${editingAsset.id}` : "/api/assets";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save asset details");

      setSuccessMsg(isEdit ? "Asset updated successfully!" : "Asset added to inventory!");
      closeModal();
      fetchAssets();
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (asset) => {
    setErrorMsg("");
    setSuccessMsg("");
    
    const confirmed = window.confirm(`Are you absolutely sure you want to delete "${asset.name}" from the inventory database?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete asset");

      setSuccessMsg(`Asset "${asset.name}" deleted successfully.`);
      fetchAssets();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: "200px", borderRadius: "12px" }}></div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Header action panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Manage catalog pool size, description texts, and condition codes.
        </p>
        <button className="btn btn-primary" onClick={openAddModal} style={{ padding: "0.6rem 1.25rem" }}>
          ➕ Add Asset
        </button>
      </div>

      {/* Action alert display */}
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

      {/* Inventory list */}
      <div className="glass-card" style={{ background: "rgba(19, 27, 46, 0.4)", padding: "1.5rem" }}>
        {assets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <span style={{ fontSize: "3rem" }}>🛠️</span>
            <h3 style={{ fontSize: "1.25rem", marginTop: "1rem" }}>Inventory is Empty</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Click "Add Asset" to start registering physical resources.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Current Stock</th>
                  <th>Condition</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const isOutOfStock = asset.availableQuantity === 0;
                  const statusClass = isOutOfStock ? "rejected" : asset.status === "Under Maintenance" ? "overdue" : "issued";
                  
                  return (
                    <tr key={asset.id}>
                      <td>
                        <strong style={{ display: "block" }}>{asset.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: #{asset.id}</span>
                      </td>
                      <td>{asset.category.name}</td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {asset.description || "—"}
                      </td>
                      <td>
                        <strong>{asset.availableQuantity}</strong>
                        <span style={{ color: "var(--text-muted)", fontWeight: "400" }}> / {asset.totalQuantity} units</span>
                      </td>
                      <td>
                        <span className={`badge badge-${statusClass}`} style={{ fontSize: "0.65rem" }}>
                          {isOutOfStock ? "Out of Stock" : asset.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => openEditModal(asset)}
                            className="btn btn-secondary"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="btn btn-danger"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                          >
                            Delete
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

      {/* Add/Edit Modal */}
      {showModal && (
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
        }} onClick={closeModal}>
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--bg-secondary)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>
              {editingAsset ? `Edit Asset: ${editingAsset.name}` : "Add New Asset"}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Asset Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sony Alpha A7 III"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="categoryId">Category</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="form-select"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="status">Condition Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Available">Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="totalQuantity">Total Pool Quantity</label>
                <input
                  id="totalQuantity"
                  name="totalQuantity"
                  type="number"
                  min="0"
                  className="form-input"
                  required
                  value={formData.totalQuantity}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Asset Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Enter specifications, serial numbers, accessory checklists..."
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalLoading}
                  style={{ flex: 1 }}
                >
                  {modalLoading ? "Saving..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
