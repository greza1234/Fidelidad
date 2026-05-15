import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("promotions")
      .select("id,title,body,price,image_url,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando promociones:", error);
      setError("No se pudieron cargar las promociones: " + error.message);
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("promotions-client")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promotions",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  if (loading) {
    return <p className="messages-empty">Cargando promociones...</p>;
  }

  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (!messages.length) {
    return <p className="messages-empty">No hay promociones por ahora.</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            background: "#fff",
            padding: 14,
            borderRadius: 16,
            marginBottom: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{msg.title}</h3>

          {msg.image_url && (
            <img
              src={msg.image_url}
              alt={msg.title}
              style={{
                width: "100%",
                marginTop: 10,
                borderRadius: 12,
                maxHeight: 260,
                objectFit: "cover",
              }}
            />
          )}

          {msg.body && (
            <p style={{ marginTop: 8, fontSize: 14 }}>{msg.body}</p>
          )}

          {msg.price && (
            <p style={{ fontWeight: 700, marginTop: 6 }}>
              Precio: {msg.price}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}