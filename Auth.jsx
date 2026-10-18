
import { useState } from "react";
import "./Auth.css";

const API_URL = "http://localhost:8080/api/auth";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint = isLogin ? "login" : "register";
    const body = isLogin
      ? { email, password }
      : { name, email, password };

    try {
    
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    },
  body: JSON.stringify(body),
   });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Request failed.");
        return;
      }
     if (isLogin) {
     localStorage.setItem("token", data.token);
     setMessage(`Welcome, ${data.name}!`);
     onLogin?.(data);
     } else {
        setMessage("Registration successful! Please log in.");
        setIsLogin(true);
        setName("");
        setPassword("");
      }
    } catch {
      setMessage("Cannot connect to the backend. Check that Spring Boot is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>FixIt</h1>
        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to your account"
            : "Create your FixIt account"}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setMessage("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={isLogin ? undefined : 8}
              required
            />
            {!isLogin && <small>Use at least 8 characters.</small>}
          </div>

          <button className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="auth-message" role="status">{message}</p>
        )}
      </section>
    </main>
  );
}
