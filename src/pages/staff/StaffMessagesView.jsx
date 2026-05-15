import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const BUCKET_NAME = "promotions";

export default function StaffMessagesView() {
  // Formulario
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Historial
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);

    const { data, error } = await supabase
      .from("promotions")
      .select("id,title,body,price,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error cargando promociones:", error);
      setError("Error cargando promociones: " + error.message);
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    setHistory(data || []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel("promotions-history")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promotions",
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHistory]);

  const createImagePath = (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeName =
      file.name
        .replace(/\.[^/.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40) || "promo";

    const random =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    return `promos/${Date.now()}-${random}-${safeName}.${ext}`;
  };

  const handleImageChange = (e) => {
    setError("");
    setSuccess("");

    const file = e.target.files?.[0] || null;

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen válida.");
      setImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const sizeMb = file.size / 1024 / 1024;

    if (sizeMb > 5) {
      setError("La imagen no debe pesar más de 5 MB.");
      setImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setImage(file);
  };

  const handleSend = async () => {
    setSuccess("");
    setError("");

    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const cleanPrice = price.trim();

    if (!cleanTitle) {
      setError("Escribe un título.");
      return;
    }

    if (!cleanBody) {
      setError("Escribe una descripción.");
      return;
    }

    setSending(true);

    try {
      let image_url = null;
      let uploadedPath = null;

      // 1. Subir imagen, si existe
      if (image) {
        const path = createImagePath(image);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, image, {
            contentType: image.type || "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error("Error subiendo imagen: " + uploadError.message);
        }

        uploadedPath = uploadData?.path || path;

        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uploadedPath);

        image_url = publicData?.publicUrl || null;
      }

      // 2. Guardar promoción en Supabase
      const { data: insertedPromotion, error: insertError } = await supabase
        .from("promotions")
        .insert({
          title: cleanTitle,
          body: cleanBody,
          price: cleanPrice || null,
          image_url,
        })
        .select("id,title,body,price,image_url,created_at")
        .single();

      if (insertError) {
        if (uploadedPath) {
          await supabase.storage.from(BUCKET_NAME).remove([uploadedPath]);
        }

        throw new Error("Error enviando promoción: " + insertError.message);
      }

      // 3. Enviar promoción al Gmail de los clientes
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-promotion-email", {
          body: {
            id: insertedPromotion.id,
            title: insertedPromotion.title,
            body: insertedPromotion.body,
            price: insertedPromotion.price,
            image_url: insertedPromotion.image_url,
          },
        });

      console.log("Respuesta envío de correos:", emailData);

      if (emailError) {
        console.error(
          "La promoción se guardó, pero falló el correo:",
          emailError
        );

        setSuccess(
          "Promoción publicada, pero no se pudo enviar al Gmail de los clientes."
        );
      } else {
        setSuccess("¡Promoción publicada y enviada al Gmail de los clientes!");
      }

      // 4. Limpiar formulario
      setTitle("");
      setBody("");
      setPrice("");
      setImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo enviar la promoción.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setSuccess("");

    if (!window.confirm("¿Estás seguro de que deseas eliminar esta promoción?")) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase.from("promotions").delete().eq("id", id);

    if (error) {
      console.error("Error eliminando promoción:", error);
      setError("Error eliminando la promoción: " + error.message);
      setDeletingId(null);
      return;
    }

    setSuccess("Promoción eliminada correctamente.");
    setDeletingId(null);

    await fetchHistory();
  };

  const formatDate = (iso) => {
    if (!iso) return "";

    return new Date(iso).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
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
          placeholder="Ejemplo: 2x1 en helados"
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Texto / descripción</label>
        <textarea
          className="auth-input"
          style={{ height: 80 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe la promoción"
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Precio (opcional)</label>
        <input
          className="auth-input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ejemplo: S/ 10"
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Imagen (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        {image && (
          <p style={{ fontSize: 13, marginTop: 6 }}>
            Imagen seleccionada: <strong>{image.name}</strong>
          </p>
        )}
      </div>

      <button
        className="auth-button-primary"
        onClick={handleSend}
        disabled={sending}
      >
        {sending ? "Enviando..." : "Enviar promoción"}
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
                  alt={p.title}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 10,
                    maxHeight: 220,
                    objectFit: "cover",
                  }}
                />
              ) : null}

              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  backgroundColor: "#FF4D4D",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {deletingId === p.id ? "Eliminando..." : "Eliminar promoción"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
