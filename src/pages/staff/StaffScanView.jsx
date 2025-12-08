import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function StaffScanView() {
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const handleDecode = (detectedCodes) => {
    if (!Array.isArray(detectedCodes) || detectedCodes.length === 0) return;

    const code = detectedCodes[0]?.rawValue;
    if (!code) return;

    setIsScanning(false);
    navigate(`/staff/add/${code}`);
  };

  const handleError = (err) => console.error("Error con la cámara:", err);

  return (
    <>
      <h2 className="client-title">Escanear</h2>
      <p className="client-subtitle">
        Escanea el código del cliente para sumar visitas.
      </p>

      {/* --- CUADRO ÚNICO --- */}
      {!isScanning && (
        <div
          className="staff-scan-frame"
          onClick={() => setIsScanning(true)}
          style={{ margin: "0 auto 12px" }}
        >
          {/* línea blanca animada */}
          <div className="staff-scan-line" />

          {/* icono cámara + marco */}
          <svg
            className="staff-scan-icon"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 22V12h10M54 22V12H44M10 42v10h10M54 42v10H44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="22"
              y="24"
              width="20"
              height="16"
              rx="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle
              cx="32"
              cy="32"
              r="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              d="M27 23l2-3h8l2 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Texto debajo del cuadro */}
      {!isScanning && (
        <p className="staff-scan-hint" style={{ textAlign: "center" }}>
          Toca el recuadro para activar la cámara
        </p>
      )}

      {/* --- Cámara cuando se toca el cuadro --- */}
      {isScanning && (
        <div style={{ marginBottom: 12 }}>
          <p className="client-subtitle">
            Apunta la cámara al código QR del cliente.
          </p>

          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <Scanner
              onScan={handleDecode}
              onError={handleError}
              constraints={{ facingMode: "environment" }}
            />
          </div>

          <button
            type="button"
            className="auth-button-primary"
            style={{ marginTop: 10 }}
            onClick={() => setIsScanning(false)}
          >
            Cancelar
          </button>
        </div>
      )}
    </>
  );
}
