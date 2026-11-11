import { useState } from "react";
import { registerUser, startSession } from "../services/authService.ts";

type TypeAuth = "login" | "register";

export function AuthScreen() {
  const [type, setType] = useState<TypeAuth>("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState<boolean>(false);

  async function sendAuth(event: React.SubmitEvent) {
    event.preventDefault();
    if (sent) return;
    setError(null);
    setNotice(null);
    setSent(true);
    try {
      if (type === "login") {
        await startSession(email, password);
      } else {
        const signedIn = await registerUser(email, password);
        if (!signedIn)
          setNotice(
            "Registration submitted. Check your email for a confirmation link, then return to log in.",
          );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSent(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h3 className="text-center mb-4">
          🎬🍿{type === "login" ? "Log In" : "Sign Up"}
        </h3>
        {error && (
          <div className="error-auth" role="alert">
            ⚠️ {error}
          </div>
        )}
        {notice && <p role="status">{notice}</p>}
        <form onSubmit={sendAuth}>
          <div className="mb-3">
            <label htmlFor="auth-email" className="form-label">
              Email
            </label>
            <input
              id="auth-email"
              autoComplete="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="auth-password" className="form-label">
              Password
            </label>
            <input
              id="auth-password"
              autoComplete={
                type === "login" ? "current-password" : "new-password"
              }
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="auth-submit btn btn-primary w-100"
            disabled={sent}
          >
            {sent ? "Loading..." : type === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
        <div className="text-center">
          <button
            className="auth-change-type"
            disabled={sent}
            onClick={() => {
              setType(type === "login" ? "register" : "login");
              setError(null);
              setNotice(null);
            }}
          >
            {type === "login"
              ? "Don’t have an account yet? Sign Up"
              : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
