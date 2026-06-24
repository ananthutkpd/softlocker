"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Document } from "@/types";
import { CATEGORY_ICONS, FILE_TYPE_ICONS } from "@/types";

interface DocumentModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentModal({ document, isOpen, onClose }: DocumentModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document) {
      setImageUrl(null);
      return;
    }

    let objectUrl: string | null = null;

    if (document.mime_type.startsWith("image/") || document.mime_type === "application/pdf") {
      const token = getToken();
      const url = api.getDownloadUrl(document.id);
      
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load preview");
          return res.blob();
        })
        .then((blob) => {
          const blobWithCorrectType = new Blob([blob], { type: document.mime_type });
          objectUrl = URL.createObjectURL(blobWithCorrectType);
          setImageUrl(objectUrl);
        })
        .catch(console.error);
    } else {
      setImageUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, document]);
  if (!isOpen || !document) return null;

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function handleDownloadOriginal() {
    const token = getToken();
    const url = api.getDownloadUrl(document!.id);
    downloadFile(url, document!.original_filename);
  }

  function handleDownloadPdf() {
    const token = getToken();
    const url = api.getDownloadPdfUrl(document!.id);
    const baseName = document!.original_filename.split(".").slice(0, -1).join(".") || document!.original_filename;
    downloadFile(url, `${baseName}.pdf`);
  }

  function downloadFile(url: string, filename: string) {
    const token = getToken();
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename;
    
    // Fetch and create blob so we can attach auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download:", err);
        alert("Failed to download document. Please try again.");
      });
  }

  const fileIcon = FILE_TYPE_ICONS[document.mime_type] || "📄";
  const categoryIcon = CATEGORY_ICONS[document.category] || "📦";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{fileIcon}</span> Document Details
          </h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem" }}>{document.original_filename}</h3>
            <div style={{ display: "flex", gap: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <span>{formatDate(document.created_at)}</span>
              <span>•</span>
              <span>{formatFileSize(document.file_size)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <div style={{ 
              background: "var(--surface)", 
              padding: "12px 16px", 
              borderRadius: "8px", 
              border: "1px solid var(--border)",
              flex: 1
            }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Category</div>
              <div style={{ fontWeight: 600 }}>{categoryIcon} {document.category}</div>
            </div>
            <div style={{ 
              background: "var(--surface)", 
              padding: "12px 16px", 
              borderRadius: "8px", 
              border: "1px solid var(--border)",
              flex: 1
            }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>File Type</div>
              <div style={{ fontWeight: 600 }}>{document.mime_type.split("/").pop()?.toUpperCase() || "Unknown"}</div>
            </div>
          </div>

          {imageUrl && document.mime_type.startsWith("image/") && (
            <div style={{ marginBottom: "24px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "16px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Document Preview" 
                style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "4px" }} 
              />
            </div>
          )}
          {imageUrl && document.mime_type === "application/pdf" && (
            <div style={{ marginBottom: "24px", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "16px" }}>
              <iframe
                src={`${imageUrl}#toolbar=0`}
                title="Document Preview"
                style={{ width: "100%", height: "400px", border: "none", borderRadius: "4px" }}
              />
            </div>
          )}

          <div>
            <h4 style={{ margin: "0 0 8px 0", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              Extracted Text (OCR)
            </h4>
            <div style={{ 
              background: "rgba(0,0,0,0.2)", 
              padding: "16px", 
              borderRadius: "8px", 
              whiteSpace: "pre-wrap",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              color: "var(--text-secondary)"
            }}>
              {document.extracted_text || "No text extracted from this document."}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary" onClick={handleDownloadOriginal}>
              Download Original
            </button>
            <button className="btn btn-primary" onClick={handleDownloadPdf}>
              Download as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
