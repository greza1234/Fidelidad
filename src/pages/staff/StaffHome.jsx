// src/pages/staff/StaffHome.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

import logo from "../../assets/img/logo.png";
import StaffScanView from "./StaffScanView.jsx";
import StaffConsoleView from "./StaffConsoleView.jsx";
import StaffMessagesView from "./StaffMessagesView.jsx";

export default function StaffHome() {
  const [selectedTab, setSelectedTab] = useState("scan");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("themeMode") || "light"
  );

  const navigate = useNavigate();

  // aplicar tema
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const applyTheme = (mode) => {
    let finalTheme = mode;

    if (mode === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      finalTheme = prefersDark ? "dark" : "light";
    }

    document.documentElement.dataset.theme = finalTheme;
    localStorage.setItem("themeMode", mode);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const initials = "IM"; // Ice Mánkora - staff

  return (
    <div className="client-root">
      {/* HEADER TOPBAR */}
      <header className="client-topbar">
        <div className="client-topbar-left">
          <img src={logo} alt="Ice Mánkora" className="client-topbar-logo" />

          <div className="client-topbar-text">
            <span className="client-topbar-brand">Nuestra tarjeta de fidelidad</span>
            <span className="client-topbar-subtitle">Panel del staff</span>
          </div>
        </div>

        <div className="client-topbar-right">
          {/* Botón avatar */}
          <button
            type="button"
            className="client-avatar-btn"
            onClick={() => setIsMenuOpen((o) => !o)}
          >
            <div className="client-avatar-circle">{initials}</div>
          </button>

          {/* MENÚ PERFIL */}
          {isMenuOpen && (
            <div className="client-profile-menu">
              <div className="client-profile-header">
                <div className="client-profile-avatar">{initials}</div>
                <div className="client-profile-info">
                  <span className="client-profile-name">Ice Mánkora</span>
                  <span className="client-profile-role">Administración</span>
                </div>
              </div>

              {/* APARIENCIA */}
              <div className="client-profile-section">
                <div className="client-profile-section-title">Apariencia</div>

                <div className="client-theme-options">
                  <button
                    className={
                      "client-theme-option " +
                      (themeMode === "light" ? "client-theme-option--active" : "")
                    }
                    onClick={() => setThemeMode("light")}
                  >
                    ☀ Claro
                  </button>

                  <button
                    className={
                      "client-theme-option " +
                      (themeMode === "dark" ? "client-theme-option--active" : "")
                    }
                    onClick={() => setThemeMode("dark")}
                  >
                    ◐ Oscuro
                  </button>
                </div>
              </div>

              {/* CERRAR SESIÓN */}
              <button
                type="button"
                className="client-profile-logout"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO CENTRAL */}
      <div className="client-card">
        {selectedTab === "scan" && <StaffScanView />}

        {selectedTab === "console" && <StaffConsoleView />}

        {selectedTab === "messages" && <StaffMessagesView />}
      </div>

      {/* MENÚ INFERIOR */}
      <nav className="client-bottom-nav">
        <div className="bottom-nav-pill">
          {/* TAB - Escanear */}
          <button
            className={
              "bottom-nav-btn " +
              (selectedTab === "scan" ? "bottom-nav-btn--active" : "")
            }
            onClick={() => setSelectedTab("scan")}
          >
            <span className="bottom-nav-icon-wrapper">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h2v3h-2zM18 18h2v2h-2zM21 18h1v1h-1z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="bottom-nav-label">Escanear</span>
          </button>

          {/* TAB - Consola */}
          <button
            className={
              "bottom-nav-btn " +
              (selectedTab === "console" ? "bottom-nav-btn--active" : "")
            }
            onClick={() => setSelectedTab("console")}
          >
            <span className="bottom-nav-icon-wrapper">
              <span className="bottom-nav-icon">▦</span>
            </span>
            <span className="bottom-nav-label">Consola</span>
          </button>

          {/* TAB - Mensajes */}
          <button
            className={
              "bottom-nav-btn " +
              (selectedTab === "messages" ? "bottom-nav-btn--active" : "")
            }
            onClick={() => setSelectedTab("messages")}
          >
            <span className="bottom-nav-icon-wrapper">
              <span className="bottom-nav-icon">✉</span>
            </span>
            <span className="bottom-nav-label">Mensajes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
