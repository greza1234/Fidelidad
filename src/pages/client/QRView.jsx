import QRCode from "react-qr-code";

export default function QRView({ userId, profile }) {
  // mismo cálculo de nombre que en FidelityView
  const displayName =
    profile?.full_name && profile.full_name.trim().length > 0
      ? profile.full_name
      : profile?.email || "";

  return (
    <>
      {/* Saludo */}
      <h2 className="client-title">Hola, {displayName}</h2>

      {/* Título del bloque */}
      <p className="client-subtitle">Tu código QR</p>

      {/* QR centrado con borde verde */}
      <div className="qr-wrapper">
        <div className="qr-box qr-box--green">
          <QRCode value={userId} size={180} />
        </div>
      </div>

      {/* Texto debajo del QR */}
      <p className="client-subtitle qr-caption">
        Muéstralo en caja para acumular visitas.
      </p>
    </>
  );
}
