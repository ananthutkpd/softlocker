/**
 * API client for SoftLocker backend.
 */

import { getToken } from "./auth";
import type {
  TokenResponse,
  User,
  Document,
  CategoriesResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string, fullName?: string): Promise<TokenResponse> {
    return this.request<TokenResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    return this.request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>("/api/auth/me");
  }

  // Documents
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<Document>("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  async listDocuments(category?: string, search?: string): Promise<Document[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    const query = params.toString();
    return this.request<Document[]>(`/api/documents${query ? `?${query}` : ""}`);
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/api/documents/${id}`);
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/api/documents/${id}`, { method: "DELETE" });
  }

  getDownloadUrl(id: string): string {
    return `${API_BASE}/api/documents/${id}/download`;
  }

  getDownloadPdfUrl(id: string): string {
    return `${API_BASE}/api/documents/${id}/download-pdf`;
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>("/api/documents/categories");
  }
}

export const api = new ApiClient();
