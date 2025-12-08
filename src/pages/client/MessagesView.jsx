import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesView() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });

      setMessages(data);
    };
    load();
  }, []);

  if (!messages.length)
    return (
      <p className="messages-empty">No hay promociones por ahora.</p>
    );

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
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{msg.title}</h3>

          {msg.image_url && (
            <img
              src={msg.image_url}
              alt=""
              style={{
                width: "100%",
                marginTop: 10,
                borderRadius: 12
              }}
            />
          )}

          {msg.body && (
            <p style={{ marginTop: 8, fontSize: 14 }}>{msg.body}</p>
          )}

          {msg.price && (
            <p style={{ fontWeight: 700, marginTop: 6 }}>Precio: {msg.price}</p>
          )}
        </div>
      ))}
    </div>
  );
}
