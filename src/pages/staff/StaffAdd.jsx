import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const REQUIRED_POINTS = 10;

export default function StaffAdd() {
  const { userId } = useParams();          // id del cliente (viene del QR)
  console.log(">>> userId desde la URL:", userId);

  const [staffSession, setStaffSession] = useState(null);

  const [profile, setProfile] = useState(null);
  const [card, setCard] = useState(null);
  const [amount, setAmount] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Cargar sesión del staff + perfil y tarjeta del cliente
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/");
        return;
      }

      setStaffSession(data.session);

      // Perfil del cliente
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error cargando perfil del cliente:", profileError);
        setError("No se pudo cargar el perfil del cliente.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Tarjeta del cliente
      const { data: cardData, error: cardError } = await supabase
        .from("loyalty_cards")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (cardError) {
        console.error("Error cargando tarjeta:", cardError);
        setError("No se pudo cargar la tarjeta de fidelidad.");
        setLoading(false);
        return;
      }

      if (!cardData) {
        // Si por algún motivo no existe la tarjeta, la creamos
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
          console.error("Error creando tarjeta:", insertError);
          setError("No se pudo crear la tarjeta del cliente.");
          setLoading(false);
          return;
        }

        setCard(newCard);
      } else {
        setCard(cardData);
      }

      setLoading(false);
    };

    load();
  }, [userId, navigate]);

  const handleAddStamps = async () => {
    if (!card || !staffSession) return;
    setError("");
    setSuccess("");
    setSaving(true);

    const newCurrent = (card.current_stamps ?? 0) + amount;
    const newTotalStamps = (card.total_stamps ?? 0) + amount;
    const newTotalVisits = (card.total_visits ?? 0) + 1; // una visita por operación

    // 1) Registrar evento en stamp_events
    const { error: eventError } = await supabase.from("stamp_events").insert({
      user_id: userId,
      staff_id: staffSession.user.id,
      amount,
    });

    if (eventError) {
      console.error("Error guardando evento:", eventError);
      setError("No se pudo registrar el evento de sellos.");
      setSaving(false);
      return;
    }

    // 2) Actualizar tarjeta del cliente
    const { data: updatedCard, error: cardError } = await supabase
      .from("loyalty_cards")
      .update({
        current_stamps: newCurrent,
        total_stamps: newTotalStamps,
        total_visits: newTotalVisits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id)
      .select()
      .single();

    if (cardError) {
      console.error("Error actualizando tarjeta:", cardError);
      setError("No se pudo actualizar la tarjeta del cliente.");
      setSaving(false);
      return;
    }

    setCard(updatedCard);
    setSaving(false);
    setSuccess("Sellos añadidos correctamente.");
    setAmount(1);
  };

  if (loading || !profile || !card) {
    return (
      <div className="client-root">
        <div className="client-loading">Cargando cliente...</div>
      </div>
    );
  }

  const points = card.current_stamps ?? 0;
  const filled = Math.min(points, REQUIRED_POINTS);
  const remaining = Math.max(REQUIRED_POINTS - points, 0);
  const progress = Math.min((points / REQUIRED_POINTS) * 100, 100);

  const displayName =
    profile.full_name && profile.full_name.trim().length > 0
      ? profile.full_name
      : profile.email;

  return (
    <div className="client-root">
      {/* Reutilizamos el header verde del staff pero con flecha atrás */}
      <header className="client-header">
        <div className="client-header-inner">
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "none",
              background: "transparent",
              color: "#fff",
              fontSize: 20,
              marginRight: 8,
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <div className="client-header-left">
            <div className="client-header-text">
              <span className="client-header-title">{displayName}</span>
              <span className="client-header-subtitle">
                Tarjeta de fidelidad
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="client-card">
        {/* Tarjeta igual que FidelityView */}
        <div className="loyalty-card">
          <div className="loyalty-card-header">
            <span className="loyalty-card-title">Visitas</span>
            <span className="loyalty-card-reward">🎁 Recompensa</span>
          </div>

          <div className="loyalty-dots">
            {Array.from({ length: REQUIRED_POINTS }).map((_, index) => (
              <div
                key={index}
                className={
                  "loyalty-dot " +
                  (index < filled ? "loyalty-dot--filled" : "")
                }
              >
                {index < filled ? "🎁" : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="loyalty-progress">
          <div className="loyalty-progress-bar">
            <div
              className="loyalty-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="loyalty-progress-text">
            El cliente tiene <strong>{points}</strong> de {REQUIRED_POINTS}.
            Le faltan <strong>{remaining}</strong> para su recompensa.
          </p>
        </div>

        {/* Número de sellos a añadir */}
        <div style={{ marginTop: 24 }}>
          <p className="client-subtitle">Número de sellos a añadir</p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "none",
                fontSize: 22,
                fontWeight: "bold",
                background: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              −
            </button>

            <div
              style={{
                minWidth: 40,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {amount}
            </div>

            <button
              type="button"
              onClick={() => setAmount((prev) => prev + 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "999px",
                border: "none",
                fontSize: 22,
                fontWeight: "bold",
                background: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Botón "deslizar para confirmar" (por ahora clic para confirmar) */}
        <button
          type="button"
          className="auth-button-primary"
          style={{ marginTop: 8 }}
          disabled={saving}
          onClick={handleAddStamps}
        >
          {saving ? "Guardando..." : "Deslizar para confirmar →"}
        </button>

        {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
        {success && (
          <p className="auth-success" style={{ marginTop: 8 }}>{success}</p>
        )}
      </div>
    </div>
  );
}
