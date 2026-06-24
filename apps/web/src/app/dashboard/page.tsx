"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Document as DocType, CategoriesResponse } from "@/types";
import { CATEGORY_ICONS, CATEGORY_ICON_BG } from "@/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DocumentCard from "@/components/DocumentCard";
import UploadModal from "@/components/UploadModal";
import DocumentModal from "@/components/DocumentModal";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocType | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await api.listDocuments(
        activeCategory || undefined,
        searchQuery || undefined
      );
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, loadDocuments]);

  async function handleDelete(id: string) {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      loadCategories();
      window.dispatchEvent(new Event("softlocker:refresh"));
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    }
  }

  function handleUploaded(doc: DocType) {
    setDocuments((prev) => [doc, ...prev]);
    loadCategories();
  }

  function handleCategoryChange(category: string | null) {
    setActiveCategory(category);
    setLoading(true);
  }

  // Stats calculation
  const totalDocs = categories?.total || 0;
  const totalCategories = categories?.categories?.length || 0;

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="main-content">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="dashboard-content">
          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "rgba(108, 92, 231, 0.1)", color: "#6C5CE7" }}
              >
                📁
              </div>
              <div className="stat-card-value">{totalDocs}</div>
              <div className="stat-card-label">Total Documents</div>
            </div>
            <div className="stat-card">
              <div
                className="stat-card-icon"
                style={{ background: "rgba(0, 206, 201, 0.1)", color: "#00CEC9" }}
              >
                🏷️
              </div>
              <div className="stat-card-value">{totalCategories}</div>
              <div className="stat-card-label">Categories Used</div>
            </div>
            {categories?.categories?.slice(0, 2).map((cat) => (
              <div className="stat-card" key={cat.category}>
                <div
                  className="stat-card-icon"
                  style={{
                    background: CATEGORY_ICON_BG[cat.category] || "rgba(178,190,195,0.15)",
                  }}
                >
                  {CATEGORY_ICONS[cat.category] || "📦"}
                </div>
                <div className="stat-card-value">{cat.count}</div>
                <div className="stat-card-label">{cat.category}</div>
              </div>
            ))}
          </div>

          {/* Section Header */}
          <div className="document-section-header">
            <h2 className="document-section-title">
              {activeCategory ? `${CATEGORY_ICONS[activeCategory] || "📁"} ${activeCategory}` : "📁 All Documents"}
              {searchQuery && ` • Search: "${searchQuery}"`}
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowUpload(true)}
            >
              <span>+</span> Upload Document
            </button>
          </div>

          {/* Document Grid */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
              <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
          ) : documents.length > 0 ? (
            <div className="document-grid">
              {documents.map((doc, i) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={handleDelete}
                  onClick={() => setSelectedDocument(doc)}
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <h3 className="empty-state-title">
                {searchQuery ? "No results found" : "No documents yet"}
              </h3>
              <p className="empty-state-text">
                {searchQuery
                  ? `No documents matching "${searchQuery}". Try a different search.`
                  : "Upload your first document and let AI categorize it automatically."}
              </p>
              {!searchQuery && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowUpload(true)}
                >
                  <span>+</span> Upload Your First Document
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
      />

      {/* Document View Modal */}
      <DocumentModal
        isOpen={!!selectedDocument}
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  );
}
