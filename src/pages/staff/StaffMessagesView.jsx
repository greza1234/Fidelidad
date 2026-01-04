import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffMessagesView() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Historial
  const [promos, setPromos] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    // Puedes cambiar "es-PE" por "es-ES" si quieres
    return d.toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setError("");

    const { data, error: readError } = await supabase
      .from("promotions")
      .select("id, title, body, price, image_url, created_at")
      .order("created_at", { ascending: false });

    if (readError) {
      console.error(readError);
      setError("Error cargando el historial de mensajes.");
      setLoadingHistory(false);
      return;
    }

    setPromos(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async () => {
    setSuccess("");
    setError("");

    if (!title.trim()) {
      setError("Escribe un título.");
      return;
    }

    let image_url = null;

    // subir imagen a storage si existe
    if (image) {
      const filename = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("promotions")
        .upload(filename, image);

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
      title: title.trim(),
      body: body.trim(),
      price: price ? price : null,
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

    // Recargar historial
    await loadHistory();
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
        <input type="file" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      </div>

      <button className="auth-button-primary" onClick={handleSend}>
        Enviar promoción
      </button>

      {success && <p className="auth-success">{success}</p>}
      {error && <p className="auth-error">{error}</p>}

      {/* HISTORIAL */}
      <div style={{ marginTop: 24 }}>
        <h3 className="client-title" style={{ fontSize: 18 }}>
          Historial de mensajes enviados
        </h3>

        {loadingHistory ? (
          <p style={{ opacity: 0.7 }}>Cargando historial...</p>
        ) : promos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Aún no has enviado promociones.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {promos.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {formatDateTime(p.created_at)}
                  </div>
                </div>

                {p.body && (
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.9 }}>
                    {p.body}
                  </div>
                )}

                {(p.price || p.price === 0) && (
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    <strong>Precio:</strong> {p.price}
                  </div>
                )}

                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt="promo"
                    style={{
                      marginTop: 10,
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #eee",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffMessagesView() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Historial
  const [promos, setPromos] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    // Puedes cambiar "es-PE" por "es-ES" si quieres
    return d.toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setError("");

    const { data, error: readError } = await supabase
      .from("promotions")
      .select("id, title, body, price, image_url, created_at")
      .order("created_at", { ascending: false });

    if (readError) {
      console.error(readError);
      setError("Error cargando el historial de mensajes.");
      setLoadingHistory(false);
      return;
    }

    setPromos(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async () => {
    setSuccess("");
    setError("");

    if (!title.trim()) {
      setError("Escribe un título.");
      return;
    }

    let image_url = null;

    // subir imagen a storage si existe
    if (image) {
      const filename = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("promotions")
        .upload(filename, image);

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
      title: title.trim(),
      body: body.trim(),
      price: price ? price : null,
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

    // Recargar historial
    await loadHistory();
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
        <input type="file" onChange={(e) => setImage(e.target.files?.[0] || null)} />
      </div>

      <button className="auth-button-primary" onClick={handleSend}>
        Enviar promoción
      </button>

      {success && <p className="auth-success">{success}</p>}
      {error && <p className="auth-error">{error}</p>}

      {/* HISTORIAL */}
      <div style={{ marginTop: 24 }}>
        <h3 className="client-title" style={{ fontSize: 18 }}>
          Historial de mensajes enviados
        </h3>

        {loadingHistory ? (
          <p style={{ opacity: 0.7 }}>Cargando historial...</p>
        ) : promos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Aún no has enviado promociones.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {promos.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {formatDateTime(p.created_at)}
                  </div>
                </div>

                {p.body && (
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.9 }}>
                    {p.body}
                  </div>
                )}

                {(p.price || p.price === 0) && (
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    <strong>Precio:</strong> {p.price}
                  </div>
                )}

                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt="promo"
                    style={{
                      marginTop: 10,
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #eee",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

      </div>
    </>
  );
}
