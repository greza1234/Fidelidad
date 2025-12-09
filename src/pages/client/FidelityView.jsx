// src/pages/client/FidelityView.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FidelityView({ profile, points, requiredPoints }) {
  const userId = profile?.id; // viene de la tabla profiles
  const [livePoints, setLivePoints] = useState(points ?? 0);

  // Si el padre cambia los puntos (ej. al entrar por primera vez), sincronizamos
  useEffect(() => {
    if (typeof points === "number") {
      setLivePoints(points);
    }
  }, [points]);

  // 🔴 1) Realtime: intenta escuchar cambios en loyalty_cards de este usuario
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`loyalty_card_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // o "UPDATE" si quieres ser más específico
          schema: "public",
          table: "loyalty_cards",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime cambio en loyalty_cards:", payload);
          const row = payload.new;
          if (row && typeof row.current_stamps === "number") {
            setLivePoints(row.current_stamps);
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado canal Realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 🔁 2) Refresco automático cada 4 segundos como respaldo
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchCard = async () => {
      const { data, error } = await supabase
        .from("loyalty_cards")
        .select("current_stamps")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error leyendo tarjeta en polling:", error);
        return;
      }

      if (!cancelled && data && typeof data.current_stamps === "number") {
        setLivePoints(data.current_stamps);
      }
    };

    // primera carga + intervalos
    fetchCard();
    const intervalId = setInterval(fetchCard, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [userId]);

  // ── lógica de la tarjeta usando livePoints ──
  const filled = Math.min(livePoints, requiredPoints);
  const remaining = Math.max(requiredPoints - livePoints, 0);
  const progress = Math.min((livePoints / requiredPoints) * 100, 100);

  const displayName =
    profile.full_name && profile.full_name.trim().length > 0
      ? profile.full_name.toUpperCase()
      : profile.email?.toUpperCase();

  return (
    <>
      <h2 className="client-title">Hola, {displayName}</h2>

      <p className="client-subtitle">Aqui verás tus puntos de visita</p>

      <div className="loyalty-card">
        <div className="loyalty-card-header">
          <span className="loyalty-card-title">Visitas</span>
        </div>

        <div className="loyalty-dots">
          {Array.from({ length: requiredPoints }).map((_, index) => (
            <div
              key={index}
              className={
                "loyalty-dot " + (index < filled ? "loyalty-dot--filled" : "")
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
          Tienes <strong>{livePoints}</strong> de {requiredPoints}. Te faltan{" "}
          <strong>{remaining}</strong> para tu recompensa.
        </p>
      </div>
    </>
  );
}
