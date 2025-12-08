import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/img/logo.png";

export default function CompleteProfile() {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        navigate("/");
        return;
      }

      const user = session.user;

      // Intentar traer perfil existente (por si ya tiene algo)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error cargando perfil:", profileError);
      }

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.birth_date) setBirthDate(profile.birth_date);
        if (profile.phone) setPhone(profile.phone);
        if (profile.marketing_opt_in !== null) {
          setMarketingOptIn(profile.marketing_opt_in);
        }
      } else {
        // si no hay perfil, usamos nombre de Google si llega
        setFullName(user.user_metadata?.full_name || "");
      }

      setLoading(false);
    };

    load();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    if (!birthDate) {
      setError("Por favor ingresa tu fecha de nacimiento.");
      return;
    }

    setSaving(true);

    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    if (!session) {
      setSaving(false);
      navigate("/");
      return;
    }

    const userId = session.user.id;

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        birth_date: birthDate,
        phone,
        marketing_opt_in: marketingOptIn,
        role: "customer",
      },
      { onConflict: "id" }
    );

    setSaving(false);

    if (upsertError) {
      console.error("Error guardando perfil:", upsertError);
      setError("No se pudo guardar tu perfil. Inténtalo de nuevo.");
      return;
    }

    // después de completar, siempre a pantalla de cliente
    navigate("/client", { replace: true });
  };

  if (loading) {
    return (
      <div className="auth-root">
        <div className="auth-card">
          <div className="client-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Ice Mánkora" className="auth-logo-img" />
        </div>
        <h2 className="client-title complete-profile-title">Completa tu perfil</h2>
        <p className="client-subtitle">
          Solo unos datos para personalizar tu experiencia ✨
        </p>

        <form onSubmit={handleSave}>
          <div className="auth-input-wrapper">
            <label className="auth-label">Nombre para la app</label>
            <input
              className="auth-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Cómo quieres que te llamemos"
            />
          </div>

          <div className="auth-input-wrapper">
            <label className="auth-label">Fecha de nacimiento</label>
            <input
              className="auth-input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="auth-input-wrapper">
            <label className="auth-label">Teléfono</label>
            <input
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número de contacto"
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <input
              id="cpMarketingOptIn"
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <label htmlFor="cpMarketingOptIn" style={{ fontSize: 13 }}>
              Acepto recibir promociones y saludos
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button-primary"
            disabled={saving}
            style={{ marginTop: 16 }}
          >
            {saving ? "Guardando..." : "Aceptar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
