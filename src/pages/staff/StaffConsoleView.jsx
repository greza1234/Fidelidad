import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffConsoleView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);

    // 1️⃣ Leer solo perfiles de clientes
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "customer");

    if (profileError) {
      console.error("Error cargando perfiles:", profileError);
      setLoading(false);
      return;
    }

    // 2️⃣ Leer todas las tarjetas
    const { data: cards, error: cardsError } = await supabase
      .from("loyalty_cards")
      .select("*");

    if (cardsError) {
      console.error("Error cargando tarjetas:", cardsError);
      setLoading(false);
      return;
    }

    // 3️⃣ Unir perfiles + tarjetas
    const merged = profiles.map((p) => {
      const card = cards.find((c) => c.user_id === p.id);
      return {
        id: p.id,
        name: p.full_name || "(sin nombre)",
        visits: card?.total_visits ?? 0,
      };
    });

    setCustomers(merged);
    setLoading(false);
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
                justifyContent: "space-between",
              }}
            >
              <span>{c.name}</span>
              <span style={{ fontWeight: "700", color: "#16a34a" }}>
                {c.visits} visitas
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
