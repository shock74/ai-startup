import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    subscriptionState?: string;
  };
};

export function App() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") ?? "");
  const [message, setMessage] = useState("Comece seu InboxZero AI agora.");
  const [user, setUser] = useState<{ email: string; subscriptionState: string } | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setToken(""));
  }, [token]);

  async function submitAuth() {
    const endpoint = mode === "register" ? "register" : "login";
    const res = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = (await res.json()) as AuthResponse | { error: string };

    if (!res.ok || "error" in data) {
      setMessage("error" in data ? data.error : "Falha no login");
      return;
    }

    setToken(data.token);
    localStorage.setItem("token", data.token);
    setUser({ email: data.user.email, subscriptionState: data.user.subscriptionState ?? "trial" });
    setMessage("Autenticação realizada com sucesso.");
  }

  async function createCheckout() {
    if (!token) return;

    const res = await fetch(`${API_URL}/billing/create-checkout-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json()) as { checkoutUrl?: string; error?: string };
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    setMessage(data.error ?? "Não foi possível iniciar o checkout.");
  }

  return (
    <main className="container">
      <section className="hero card">
        <h1>InboxZero AI</h1>
        <p>
          SaaS global para limpar e priorizar caixas de entrada com IA, em minutos.
        </p>
        <ul>
          <li>Resumo diário dos e-mails importantes</li>
          <li>Resposta sugerida com IA</li>
          <li>Regras automáticas anti-ruído</li>
        </ul>
      </section>

      {!token ? (
        <section className="card auth">
          <div className="tabs">
            <button onClick={() => setMode("register")} className={mode === "register" ? "active" : ""}>Criar conta</button>
            <button onClick={() => setMode("login")} className={mode === "login" ? "active" : ""}>Entrar</button>
          </div>

          <input
            type="email"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={submitAuth}>{mode === "register" ? "Começar teste grátis" : "Entrar"}</button>
          <p className="feedback">{message}</p>
        </section>
      ) : (
        <section className="card dashboard">
          <h2>Dashboard</h2>
          <p>Conta: {user?.email}</p>
          <p>Plano atual: {user?.subscriptionState ?? "trial"}</p>
          <button onClick={createCheckout}>Fazer upgrade para Pro</button>
          <button
            className="ghost"
            onClick={() => {
              localStorage.removeItem("token");
              setToken("");
              setUser(null);
            }}
          >
            Sair
          </button>
          <p className="feedback">{message}</p>
        </section>
      )}
    </main>
  );
}
