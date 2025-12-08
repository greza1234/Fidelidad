import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

import FidelityView from "./FidelityView.jsx";
import QRView from "./QRView.jsx";
import MessagesView from "./MessagesView.jsx";
import logo from "../../assets/img/logo.png";

const REQUIRED_POINTS = 10;

export default function ClientHome() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [card, setCard] = useState(null);
  const [selectedTab, setSelectedTab] = useState("fidelity");

  // menú de perfil
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // tema: "light" | "dark" | "system"
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "system"
  );

  const navigate = useNavigate();

  // ---------- THEME ----------
  useEffect(() => {
    const applyTheme = (value) => {
      let finalTheme = value;

      if (value === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        finalTheme = prefersDark ? "dark" : "light";
      }

      document.documentElement.setAttribute("data-theme", finalTheme);
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ---------- LOAD SESSION / DATA ----------
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/");
        return;
      }

      setSession(data.session);
      await fetchProfile(data.session.user.id);
      await fetchCard(data.session.user.id);
    };

    load();
  }, [navigate]);

  // ----------- PROFILE -----------
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error profile:", error);
      return null;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: "",
        role: "customer",
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn("Profile ya existía, lo vuelvo a leer...");
        const { data: existing, error: existingError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!existingError && existing) {
          setProfile(existing);
          return existing;
        }
      }

      console.error("Error creando profile:", insertError);
      return null;
    }

    setProfile(newProfile);
    return newProfile;
  };

  // ----------- LOYALTY CARD -----------
  const fetchCard = async (userId) => {
    const { data, error } = await supabase
      .from("loyalty_cards")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error card:", error);
      return null;
    }

    if (data) {
      setCard(data);
      return data;
    }

    const { data: newCard, error: insertError } = await supabase
      .from("loyalty_cards")
      .insert({
        user_id: userId,
        current_stamps: 0,
        total_visits: 0,
        total_stamps: 0,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        console.warn("Card ya existía, la vuelvo a leer...");
        const { data: existing, error: existingError } = await supabase
          .from("loyalty_cards")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingError && existing) {
          setCard(existing);
          return existing;
        }
      }

      console.error("Error creando loyalty_card:", insertError);
      return null;
    }

    setCard(newCard);
    return newCard;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!session || !profile || !card) {
    return (
      <div className="client-root">
        <div className="client-loading">Cargando...</div>
      </div>
    );
  }

  // ---------- DATOS PARA HEADER ----------
  const displayName =
    (profile.full_name && profile.full_name.trim()) || profile.email || "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  const readableTheme = (value) => {
    if (value === "light") return "Claro";
    if (value === "dark") return "Oscuro";
    return "Sistema";
  };

  return (
    <div className="client-root">
      {/* HEADER NUEVO */}
      <header className="client-topbar">
        <div className="client-topbar-left">
          <img src={logo} alt="Ice Mánkora" className="client-topbar-logo" />
          <div className="client-topbar-text">
            <div className="client-topbar-brand">Tu Tarjeta de fidelidad digital</div>
           
          </div>
        </div>

        <div className="client-topbar-right">
          <button
            className="client-avatar-btn"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
          >
            <span className="client-avatar-circle">
              {initials || "?"}
            </span>
          </button>

          {profileMenuOpen && (
            <div className="client-profile-menu">
              <div className="client-profile-header">
                <div className="client-profile-avatar">
                  {initials || "?"}
                </div>
                <div className="client-profile-info">
                  <div className="client-profile-name">
                    {displayName || "Cliente"}
                  </div>
                  <div className="client-profile-role">Cliente</div>
                </div>
              </div>

              <div className="client-profile-section">
                <div className="client-profile-section-title">Apariencia</div>
                <div className="client-theme-options">
                  <button
                    type="button"
                    className={
                      "client-theme-option " +
                      (theme === "light" ? "client-theme-option--active" : "")
                    }
                    onClick={() => setTheme("light")}
                  >
                    ☀ Claro
                  </button>
                  <button
                    type="button"
                    className={
                      "client-theme-option " +
                      (theme === "dark" ? "client-theme-option--active" : "")
                    }
                    onClick={() => setTheme("dark")}
                  >
                    ◐ Oscuro
                  </button>
                  
                </div>
                <div className="client-theme-current">
                  Modo actual: {readableTheme(theme)}
                </div>
              </div>

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

      {/* CONTENIDO (cambia según pestaña) */}
      <div className="client-card">
        {selectedTab === "fidelity" && (
          <FidelityView
            profile={profile}
            points={card.current_stamps}
            requiredPoints={REQUIRED_POINTS}
          />
        )}

        {selectedTab === "qr" && (
          <QRView userId={session.user.id} profile={profile} />
          )}


        {selectedTab === "messages" && <MessagesView />}
      </div>

      {/* MENÚ INFERIOR */}
      <nav className="client-bottom-nav">
        <div className="bottom-nav-pill">
          {/* QR */}
          <button
            className={
              "bottom-nav-btn " +
              (selectedTab === "qr" ? "bottom-nav-btn--active" : "")
            }
            onClick={() => setSelectedTab("qr")}
          >
            <span className="bottom-nav-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm10-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm11-5h2v2h-2v-2zm0 4h2v4h-2v-4zm4-4h2v2h-2v-2zm0 4h2v4h-2v-4zm-4 4h2v2h-2v-2z" />
              </svg>
            </span>
            <span className="bottom-nav-label">Código QR</span>
          </button>

          {/* Fidelidad */}
          <button
            className={
              "bottom-nav-btn " +
              (selectedTab === "fidelity" ? "bottom-nav-btn--active" : "")
            }
            onClick={() => setSelectedTab("fidelity")}
          >
            <span className="bottom-nav-icon-wrapper">
              <span className="bottom-nav-icon">★</span>
            </span>
            <span className="bottom-nav-label">Fidelidad</span>
          </button>

          {/* Mensajes */}
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
