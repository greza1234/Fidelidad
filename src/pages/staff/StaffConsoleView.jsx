import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffConsoleView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // para input por cliente (sumar X)
  const [addMap, setAddMap] = useState({}); // { [userId]: "3" }
  const [busyId, setBusyId] = useState(null); // para deshabilitar botones mientras actualiza

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);

    // 1) perfiles clientes
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "customer");

    if (profileError) {
      console.error("Error cargando perfiles:", profileError);
      setLoading(false);
      return;
    }

    // 2) tarjetas
    const { data: cards, error: cardsError } = await supabase
      .from("loyalty_cards")
      .select("id,user_id,total_visits");

    if (cardsError) {
      console.error("Error cargando tarjetas:", cardsError);
      setLoading(false);
      return;
    }

    // 3) merge
    const merged = profiles.map((p) => {
      const card = cards.find((c) => c.user_id === p.id);
      return {
        id: p.id,
        name: p.full_name || "(sin nombre)",
        visits: card?.total_visits ?? 0,
      };
    });

    // orden opcional: más visitas arriba
    merged.sort((a, b) => b.visits - a.visits);

    setCustomers(merged);
    setLoading(false);
  };

  // asegura que exista loyalty_cards para el usuario
  const ensureCard = async (userId) => {
    const { data: existing, error } = await supabase
      .from("loyalty_cards")
      .select("id,user_id,total_visits")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (existing) return existing;

    // crea tarjeta si no existe
    const { data: inserted, error: insErr } = await supabase
      .from("loyalty_cards")
      .insert({ user_id: userId, total_visits: 0 })
      .select("id,user_id,total_visits")
      .single();

    if (insErr) throw insErr;
    return inserted;
  };

  // suma/resta visitas (delta puede ser positivo o negativo)
  const updateVisits = async (userId, delta) => {
    if (!delta || Number.isNaN(delta)) return;

    setBusyId(userId);

    try {
      const card = await ensureCard(userId);

      const current = card.total_visits ?? 0;
      const next = Math.max(current + delta, 0); // nunca negativo

      const { error: updErr } = await supabase
        .from("loyalty_cards")
        .update({ total_visits: next })
        .eq("user_id", userId);

      if (updErr) throw updErr;

      // actualizar UI al instante
      setCustomers((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, visits: next } : c))
      );
    } catch (e) {
      console.error("Error actualizando visitas:", e);
      alert("No se pudo actualizar las visitas. Revisa permisos/RLS.");
    } finally {
      setBusyId(null);
    }
  };

  const onAddInputChange = (userId, value) => {
    setAddMap((prev) => ({ ...prev, [userId]: value }));
  };

  const addCustom = async (userId) => {
    const raw = addMap[userId];
    const n = parseInt(raw, 10);

    if (!raw || Number.isNaN(n) || n <= 0) {
      alert("Ingresa un número válido (mayor a 0).");
      return;
    }

    await updateVisits(userId, n);

    // limpiar input
    setAddMap((prev) => ({ ...prev, [userId]: "" }));
  };

  return (
    <div>
      <h2 className="client-title">Clientes Registrados</h2>

      {loading && <p className="client-subtitle">Cargando...</p>}

      {!loading && customers.length === 0 && (
        <p className="client-subtitle">Aún no hay clientes registrados.</p>
      )}

      {!loading && customers.length > 0 && (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {customers.map((c) => (
            <li
              key={c.id}
              style={{
                background: "#fff",
                padding: "12px 16px",
                borderRadius: "14px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {/* Nombre */}
              <span style={{ fontWeight: 600, flex: 1 }}>{c.name}</span>

              {/* Visitas */}
              <span style={{ fontWeight: "800", color: "#16a34a" }}>
                {c.visits} visitas
              </span>

              {/* Controles */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => updateVisits(c.id, -1)}
                  disabled={busyId === c.id}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                  title="Restar 1"
                >
                  -1
                </button>

                <button
                  onClick={() => updateVisits(c.id, +1)}
                  disabled={busyId === c.id}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#16a34a",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  title="Sumar 1"
                >
                  +1
                </button>
  
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
