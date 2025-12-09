import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import logo from "../assets/img/logo.png";
import logoSplash from "../assets/img/logo.png";

// Íconos del ojo
const EyeIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-6.94" />
    <path d="M9.88 9.88a3 3 0 1 1 4.24 4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="20"
    height="20"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303C33.602,31.91,29.197,35,24,35c-6.627,0-12-5.373-12-12
      s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.869,5.012,29.7,3,24,3C12.955,3,4,11.955,4,23
      s8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
      C34.869,5.012,29.7,3,24,3C15.572,3,8.513,7.79,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,43c5.136,0,9.733-1.977,13.186-5.186l-6.09-4.957C29.118,34.091,26.68,35,24,35
      c-5.176,0-9.567-3.054-11.495-7.438l-6.522,5.025C8.144,38.329,15.477,43,24,43z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.96,2.207-2.555,4.074-4.607,5.377
      c0.001-0.001,0.002-0.001,0.003-0.002l6.09,4.957C35.98,39.715,44,34,44,23
      C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export default function Login() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState("login");

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassLogin, setShowPassLogin] = useState(false);

  // registro
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  // Splash
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const clearMessages = () => {
    setError("");
    setResetMessage("");
  };

  // Redirige según perfil; si falta info => complete-profile
  const ensureProfileAndRedirect = async (userId) => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error leyendo perfil:", profileError);
      setError("No se pudo cargar tu perfil.");
      return;
    }

    // Si no hay perfil o le falta nombre o fecha, lo mandamos a completar
    if (!profile || !profile.full_name || !profile.birth_date) {
      navigate("/complete-profile", { replace: true });
      return;
    }

    const role = profile.role || "customer";
    if (role === "staff" || role === "admin") {
      navigate("/staff", { replace: true });
    } else {
      navigate("/client", { replace: true });
    }
  };

  // Auto-redirect si ya hay sesión (y escuchar cambios después de Google)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session) {
        await ensureProfileAndRedirect(session.user.id);
      }
    };

    checkSession();

    // Escuchar cambios de sesión (útil al volver de Google)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        ensureProfileAndRedirect(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // no ponemos navigate para que no se vuelva loco con StrictMode

  // ---------- LOGIN ----------
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Error login:", error);
      if (
        error.message &&
        error.message.toLowerCase().includes("invalid login credentials")
      ) {
        setError("Esta cuenta no existe o los datos son incorrectos.");
      } else {
        setError("Ocurrió un error al iniciar sesión.");
      }
      return;
    }

    const user = data.user;
    if (!user) {
      setError("No se pudo obtener el usuario.");
      return;
    }

    await ensureProfileAndRedirect(user.id);
  };

  // Validación sencilla de formato de correo
  const isValidEmailFormat = (mail) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(mail);
  };

  // ---------- REGISTRO ----------
  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setError("Debes ingresar tu nombre.");
      return;
    }
    if (!birthDate) {
      setError("Debes ingresar tu fecha de nacimiento.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Debes ingresar un correo.");
      return;
    }
    if (!isValidEmailFormat(regEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
    });

    setLoading(false);

    if (error) {
      console.error("Error signup:", error);
      if (
        error.message &&
        error.message.toLowerCase().includes("already registered")
      ) {
        setError("Este correo ya está registrado. Inicia sesión.");
      } else {
        setError("No se pudo crear la cuenta.");
      }
      return;
    }

    const user = data.user;
    if (!user) {
      setError(
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión."
      );
      return;
    }

    // Crear perfil completo
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        birth_date: birthDate,
        phone,
        marketing_opt_in: marketingOptIn,
        role: "customer",
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Error guardando perfil:", upsertError);
      setError("No se pudo guardar tu perfil.");
      return;
    }
    // Crear tarjeta de puntos automáticamente
const { error: cardError } = await supabase
  .from("loyalty_cards")
  .insert({
    user_id: user.id,
    points: 0
  });

if (cardError) {
  console.error("Error creando tarjeta:", cardError);
  // No bloqueamos el registro, solo avisamos en consola.
}




    // Ya está logueado, lo mandamos directo a cliente
    await ensureProfileAndRedirect(user.id);
  };

  // ---------- Google ----------
  const handleGoogleLogin = async () => {
    clearMessages();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // 🚨 clave: SIEMPRE devolver al origen (localhost o vercel)
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Error Google login:", error);
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  // ---------- Recuperar contraseña ----------
  const handleResetPassword = async () => {
    clearMessages();

    if (!email) {
      setError("Escribe tu correo para recuperar la contraseña.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/update-password",
    });

    if (error) setError(error.message);
    else setResetMessage("Revisa tu correo para cambiar tu contraseña.");
  };

  // ---------- VISTAS ----------

  const renderLoginView = () => (
    <form onSubmit={handleLogin}>
      <div className="auth-logo">
        <img src={logo} alt="Ice Mánkora" className="auth-logo-img" />
      </div>

      <div className="auth-subtitle">Bienvenido</div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Correo electrónico</label>
        <input
          className="auth-input"
          type="email"
          placeholder="tucorreo@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Contraseña</label>
        <input
          className="auth-input"
          type={showPassLogin ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span
          className="auth-password-toggle"
          onClick={() => setShowPassLogin(!showPassLogin)}
        >
          {showPassLogin ? EyeIcon : EyeOffIcon}
        </span>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {resetMessage && <p className="auth-success">{resetMessage}</p>}

      <button
        type="submit"
        className="auth-button-primary"
        disabled={loading}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <div
        style={{
          textAlign: "right",
          marginTop: 8,
          fontSize: 13,
          cursor: "pointer",
          color: "#16a34a",
        }}
        onClick={handleResetPassword}
      >
        ¿Olvidaste tu contraseña?
      </div>

      <div className="auth-or">O ingresar con</div>

      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleLogin}
      >
        <span className="auth-google-icon">{GoogleIcon}</span>
        <span>Google</span>
      </button>

      <div className="auth-footer-text">
        ¿No tienes una cuenta?
        <span
          className="auth-footer-link"
          onClick={() => {
            clearMessages();
            setMode("register");
          }}
        >
          Registrarse
        </span>
      </div>
    </form>
  );

  const renderRegisterView = () => (
    <form onSubmit={handleSignup}>
      <div className="auth-logo">
        <img src={logo} alt="Ice Mánkora" className="auth-logo-img" />
      </div>
      <div className="auth-subtitle">Crear tu cuenta</div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Nombre</label>
        <input
          className="auth-input"
          type="text"
          placeholder="Tu nombre"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Fecha de nacimiento</label>
        <input
          className="auth-input"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Teléfono</label>
        <input
          className="auth-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Tu número de contacto"
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Correo electrónico</label>
        <input
          className="auth-input"
          type="email"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
        />
      </div>

      <div className="auth-input-wrapper">
        <label className="auth-label">Contraseña</label>
        <input
          className="auth-input"
          type="password"
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
        }}
      >
        <input
          id="marketingOptIn"
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
        />
        <label htmlFor="marketingOptIn" style={{ fontSize: 13 }}>
          Acepto recibir promociones y saludos
        </label>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button
        type="submit"
        className="auth-button-primary"
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>

      <div className="auth-or">O registrarte con</div>

      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleLogin}
      >
        <span className="auth-google-icon">{GoogleIcon}</span>
        <span>Google</span>
      </button>

      <div className="auth-footer-text">
        ¿Ya tienes una cuenta?
        <span
          className="auth-footer-link"
          onClick={() => {
            clearMessages();
            setMode("login");
          }}
        >
          Iniciar sesión
        </span>
      </div>
    </form>
  );

  if (showSplash) {
    return (
      <div className="splash-container">
        <div className="splash-inner">
          <img src={logoSplash} alt="Ice Mánkora" className="splash-logo" />

          <div className="splash-dots">
            <span className="splash-dot" />
            <span className="splash-dot" />
            <span className="splash-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        {mode === "login" ? renderLoginView() : renderRegisterView()}
      </div>
    </div>
  );
}
