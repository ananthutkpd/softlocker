/* Types for SoftLocker frontend */

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  category: string;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CategoriesResponse {
  categories: CategoryCount[];
  total: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}

export type DocumentCategory =
  | "Resume"
  | "Invoice"
  | "Certificate"
  | "Medical Report"
  | "Legal Document"
  | "Bank Statement"
  | "Identity Document"
  | "Other";

export const CATEGORY_ICONS: Record<string, string> = {
  Resume: "📄",
  Invoice: "💳",
  Certificate: "🎓",
  "Medical Report": "🏥",
  "Legal Document": "⚖️",
  "Bank Statement": "🏦",
  "Identity Document": "🪪",
  Other: "📦",
};

export const CATEGORY_BADGE_CLASS: Record<string, string> = {
  Resume: "badge-resume",
  Invoice: "badge-invoice",
  Certificate: "badge-certificate",
  "Medical Report": "badge-medical",
  "Legal Document": "badge-legal",
  "Bank Statement": "badge-bank",
  "Identity Document": "badge-identity",
  Other: "badge-other",
};

export const CATEGORY_ICON_BG: Record<string, string> = {
  Resume: "rgba(108, 92, 231, 0.1)",
  Invoice: "rgba(0, 206, 201, 0.1)",
  Certificate: "rgba(253, 203, 110, 0.15)",
  "Medical Report": "rgba(225, 112, 85, 0.1)",
  "Legal Document": "rgba(99, 110, 114, 0.1)",
  "Bank Statement": "rgba(0, 184, 148, 0.1)",
  "Identity Document": "rgba(232, 67, 147, 0.1)",
  Other: "rgba(178, 190, 195, 0.15)",
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "application/pdf": "📕",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📘",
};
