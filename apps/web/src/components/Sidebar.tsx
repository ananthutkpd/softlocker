"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { User, CategoriesResponse } from "@/types";
import { CATEGORY_ICONS } from "@/types";

interface SidebarProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  // Expose a way for parent to trigger refresh
  useEffect(() => {
    const handler = () => loadCategories();
    window.addEventListener("softlocker:refresh", handler);
    return () => window.removeEventListener("softlocker:refresh", handler);
  }, []);

  const allCategories = [
    "Identity Document",
    "Resume",
    "Invoice",
    "Certificate",
    "Medical Report",
    "Legal Document",
    "Bank Statement",
    "Other",
  ];

  function getCategoryCount(cat: string): number {
    if (!categories) return 0;
    const found = categories.categories.find((c) => c.category === cat);
    return found?.count || 0;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔒</div>
          <span className="sidebar-logo-text">SoftLocker</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Documents</div>

        <div
          className={`sidebar-item ${activeCategory === null ? "active" : ""}`}
          onClick={() => onCategoryChange(null)}
        >
          <span className="sidebar-item-icon">📁</span>
          All Documents
          {categories && (
            <span className="sidebar-item-count">{categories.total}</span>
          )}
        </div>

        <div className="sidebar-section-title" style={{ marginTop: "8px" }}>
          Categories
        </div>

        {allCategories.map((cat) => (
          <div
            key={cat}
            className={`sidebar-item ${activeCategory === cat ? "active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            <span className="sidebar-item-icon">
              {CATEGORY_ICONS[cat] || "📁"}
            </span>
            {cat}
            <span className="sidebar-item-count">{getCategoryCount(cat)}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
