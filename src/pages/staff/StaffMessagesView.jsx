import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffMessagesView() {
  // formulario
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // historial
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);

    const { data, error } = await supabase
      .from("promotions")
      .select("id,title,body,price,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      setLoadingHistory(false);
      return;
    }

    setHistory(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();

    // realtime (si tienes Realtime habilitado para la tabla promotions)
    const channel = supabase
      .channel("promotions-history")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "promotions" },
        (payload) => {
          setHistory((prev) => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async () => {
    setSuccess("");
    setError("");

    if (!title.trim()) {
      setError("Escribe un título.");
      return;
    }
    if (!body.trim()) {
      setError("Escribe una descripción.");
      return;
    }

    let image_url = null;

    // subir imagen a storage si existe
    if (image) {
      const filename = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("promotions")
        .upload(filename, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        setError("Error subiendo la imagen.");
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("promotions")
        .getPublicUrl(filename);

      image_url = publicUrl?.publicUrl || null;
    }

    // insertar registro
    const { error: insertError } = await supabase.from("promotions").insert({
      title,
      body,
      price: price || null,
      image_url,
    });

    if (insertError) {
      console.error(insertError);
      setError("Error enviando promoción.");
      return;
    }

    setSuccess("¡Promoción enviada correctamente!");
    setTitle("");
    setBody("");
    setPrice("");
    setImage(null);

    // por si realtime no está activo, igual refrescamos
    fetchHistory();
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(); // fecha y hora
  };

  return (
    <>
      <h2 className="client-title">Crear promoción</h2>

      <div className="auth-input-wrapper">
        <label className="auth-label">Título</label>
        <input
          className="auth-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Texto / descripción</label>
        <textarea
          className="auth-input"
          style={{ height: 80 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Precio (opcional)</label>
        <input
          className="auth-input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Imagen (opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
      </div>

      <button className="auth-button-primary" onClick={handleSend}>
        Enviar promoción
      </button>

      {success && <p className="auth-success">{success}</p>}
      {error && <p className="auth-error">{error}</p>}

      <hr style={{ margin: "18px 0" }} />

      <h3 style={{ marginBottom: 10 }}>Historial de promociones</h3>

      {loadingHistory ? (
        <p>Cargando historial...</p>
      ) : history.length === 0 ? (
        <p>No hay promociones enviadas aún.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {history.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {formatDate(p.created_at)}
              </div>

              {p.price ? (
                <div style={{ marginTop: 6, fontWeight: 600 }}>
                  Precio: {p.price}
                </div>
              ) : null}

              <div style={{ marginTop: 6 }}>{p.body}</div>

              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt="promo"
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 10,
                    maxHeight: 220,
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
