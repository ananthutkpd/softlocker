"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type { Document } from "@/types";
import { CATEGORY_ICONS } from "@/types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (doc: Document) => void;
}

export default function UploadModal({ isOpen, onClose, onUploaded }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const allowedExts = [".jpg", ".jpeg", ".png", ".pdf", ".docx"];

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      setError(`File type "${ext}" not supported. Allowed: ${allowedExts.join(", ")}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }
    setError(null);
    setUploadResult(null);
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDocument(selectedFile);
      setUploadResult(result);
      onUploaded(result);
      // Trigger sidebar refresh
      window.dispatchEvent(new Event("softlocker:refresh"));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload Document</h2>
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {!uploadResult && (
            <>
              <div
                className={`dropzone ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="dropzone-icon">📂</div>
                <div className="dropzone-text">
                  <strong>Click to browse</strong> or drag & drop
                </div>
                <div className="dropzone-hint">
                  JPG, PNG, PDF, DOCX • Max 10MB
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.docx"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>

              {selectedFile && (
                <div className="selected-file" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  {previewUrl && selectedFile.type.startsWith("image/") && (
                    <div style={{ marginBottom: "16px", textAlign: "center", background: "rgba(0,0,0,0.1)", borderRadius: "8px", padding: "8px" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "4px" }} />
                    </div>
                  )}
                  {previewUrl && selectedFile.type === "application/pdf" && (
                    <div style={{ marginBottom: "16px", background: "rgba(0,0,0,0.1)", borderRadius: "8px", padding: "8px" }}>
                      <iframe src={`${previewUrl}#toolbar=0`} style={{ width: "100%", height: "300px", border: "none", borderRadius: "4px" }} />
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <span className="selected-file-icon">📎</span>
                    <div className="selected-file-info" style={{ marginLeft: "12px", flex: 1 }}>
                      <div className="selected-file-name">{selectedFile.name}</div>
                      <div className="selected-file-size">
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                    <button className="selected-file-remove" onClick={handleReset}>
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="upload-progress">
                  <div className="upload-progress-bar">
                    <div
                      className="upload-progress-fill"
                      style={{ width: "70%" }}
                    />
                  </div>
                  <div className="upload-progress-text">
                    <span>Processing & categorizing...</span>
                    <div className="spinner" />
                  </div>
                </div>
              )}
            </>
          )}

          {uploadResult && (
            <div className="upload-result">
              <span className="upload-result-icon">✅</span>
              <div className="upload-result-text">
                <div className="upload-result-filename">
                  {uploadResult.original_filename}
                </div>
                <div className="upload-result-category">
                  Categorized as:{" "}
                  {CATEGORY_ICONS[uploadResult.category] || "📦"}{" "}
                  <strong>{uploadResult.category}</strong>
                </div>
              </div>
            </div>
          )}

          {error && <div className="auth-error" style={{ marginTop: "16px" }}>{error}</div>}
        </div>

        <div className="modal-footer">
          {!uploadResult ? (
            <>
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Uploading..." : "Upload & Categorize"}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleReset}>
                Upload Another
              </button>
              <button className="btn btn-primary" onClick={handleClose}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
