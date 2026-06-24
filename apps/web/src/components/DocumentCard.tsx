"use client";

import type { Document } from "@/types";
import {
  CATEGORY_ICONS,
  CATEGORY_BADGE_CLASS,
  CATEGORY_ICON_BG,
  FILE_TYPE_ICONS,
} from "@/types";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function DocumentCard({ document, onDelete, style, onClick }: DocumentCardProps) {
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    const token = getToken();
    const url = api.getDownloadUrl(document.id);
    // Open download in new window with auth
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.original_filename;
    // For auth, we need to fetch and create blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete "${document.original_filename}"?`)) {
      onDelete(document.id);
    }
  }

  const fileIcon = FILE_TYPE_ICONS[document.mime_type] || "📄";
  const categoryIcon = CATEGORY_ICONS[document.category] || "📦";
  const badgeClass = CATEGORY_BADGE_CLASS[document.category] || "badge-other";
  const iconBg = CATEGORY_ICON_BG[document.category] || "rgba(178, 190, 195, 0.15)";

  return (
    <div 
      className="document-card" 
      style={{ ...style, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <div className="document-card-header">
        <div
          className="document-card-icon"
          style={{ background: iconBg }}
        >
          {fileIcon}
        </div>
        <div className="document-card-actions">
          <button
            className="document-card-action"
            title="Download"
            onClick={handleDownload}
          >
            ⬇️
          </button>
          <button
            className="document-card-action danger"
            title="Delete"
            onClick={handleDelete}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="document-card-name" title={document.original_filename}>
        {document.original_filename}
      </div>

      <div className="document-card-meta">
        <span className={`badge ${badgeClass}`}>
          {categoryIcon} {document.category}
        </span>
        <span className="document-card-size">{formatFileSize(document.file_size)}</span>
      </div>

      <div
        className="document-card-date"
        style={{ marginTop: "8px" }}
      >
        {formatDate(document.created_at)}
      </div>
    </div>
  );
}
