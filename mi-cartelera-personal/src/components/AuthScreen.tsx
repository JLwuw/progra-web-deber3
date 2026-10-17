import { useState } from "react";
import { registerUser, startSession } from "../services/authService.ts";

type TypeAuth = "login" | "register";

export function AuthScreen() {
  const [type, setType] = useState<TypeAuth>("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<boolean>(false);

  async function sendAuth(event: React.SubmitEvent) {
    event.preventDefault()
    setError(null)
    setSent(true)
    try {
      if (type === "login") {
        await startSession(email, password)
      } else {
        await registerUser(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.")
    } finally {
      setSent(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h3 className="text-center mb-4">🎬🍿{type === "login" ? "Log In" : "Sign Up"}</h3>
        {error && <div className="error-auth">⚠️ {error}</div>}
        <form onSubmit={sendAuth}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-control" value={password}
              onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <button type="submit" className="auth-submit btn btn-primary w-100" disabled={sent}>
            {sent ? "Loading..." : type === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
        <div className="text-center">
          <button className="auth-change-type"
            onClick={() => { setType(type === "login" ? "register" : "login"); setError(null); }}>
            {type === "login" ? "Dont have an account yet? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
