export default function FidelityView({ profile, points, requiredPoints }) {
  const filled = Math.min(points, requiredPoints);
  const remaining = Math.max(requiredPoints - points, 0);
  const progress = Math.min((points / requiredPoints) * 100, 100);

  const displayName =
    profile.full_name && profile.full_name.trim().length > 0
      ? profile.full_name.toUpperCase()
      : profile.email?.toUpperCase();

  return (
    <>
      <h2 className="client-title">Hola, {displayName}</h2>

      <p className="client-subtitle">Aqui verás tus puntos de visita</p>

      <div className="loyalty-card">
        <div className="loyalty-card-header">
          <span className="loyalty-card-title">Visitas</span>
          
        </div>

        <div className="loyalty-dots">
          {Array.from({ length: requiredPoints }).map((_, index) => (
            <div
              key={index}
              className={
                "loyalty-dot " + (index < filled ? "loyalty-dot--filled" : "")
              }
            >
              {index < filled ? "🎁" : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="loyalty-progress">
        <div className="loyalty-progress-bar">
          <div
            className="loyalty-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="loyalty-progress-text">
          Tienes <strong>{points}</strong> de {requiredPoints}. Te faltan{" "}
          <strong>{remaining}</strong> para tu recompensa.
        </p>
      </div>
    </>
  );
}
