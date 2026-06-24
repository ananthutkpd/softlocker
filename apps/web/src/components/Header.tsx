"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { removeToken } from "@/lib/auth";
import type { User } from "@/types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch {
      // Not authenticated
      router.push("/login");
    }
  }

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  function getInitials(): string {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-greeting">
          {getGreeting()}, {user?.full_name || user?.email || "User"}!
        </span>
        <h1 className="header-title">Your Documents</h1>
      </div>

      <div className="header-right">
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div style={{ position: "relative" }}>
          <div className="header-avatar" onClick={() => setShowMenu(!showMenu)}>
            {getInitials()}
          </div>

          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-item">
                <span>👤</span>
                <span>{user?.email}</span>
              </div>
              <div
                className="user-menu-item danger"
                onClick={handleLogout}
              >
                <span>🚪</span>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
