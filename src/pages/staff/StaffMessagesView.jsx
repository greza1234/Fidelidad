import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function StaffMessagesView() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSend = async () => {
    setSuccess("");
    setError("");

    let image_url = null;

    // subir imagen a storage si existe
    if (image) {
      const filename = `${Date.now()}-${image.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from("promotions")
        .upload(filename, image);

      if (uploadError) {
        setError("Error subiendo la imagen.");
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("promotions")
        .getPublicUrl(filename);

      image_url = publicUrl.publicUrl;
    }

    // insertar registro
    const { error: insertError } = await supabase.from("promotions").insert({
      title,
      body,
      price,
      image_url
    });

    if (insertError) {
      setError("Error enviando promoción.");
      return;
    }

    setSuccess("¡Promoción enviada correctamente!");
    setTitle("");
    setBody("");
    setPrice("");
    setImage(null);
  };

  return (
    <>
      <h2 className="client-title">Crear promoción</h2>

      <div className="auth-input-wrapper">
        <label className="auth-label">Título</label>
        <input className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} />
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
        <input className="auth-input" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Imagen (opcional)</label>
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      </div>

      <button className="auth-button-primary" onClick={handleSend}>
        Enviar promoción
      </button>

      {success && <p className="auth-success">{success}</p>}
      {error && <p className="auth-error">{error}</p>}
    </>
  );
}
