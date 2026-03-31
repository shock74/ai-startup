import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-09-30.acacia"
});

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type AuthPayload = {
  sub: string;
  email: string;
};

function signToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, jwtSecret, { expiresIn: "7d" });
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
    (req as express.Request & { user: AuthPayload }).user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/register", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email já cadastrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash }
  });

  const token = signToken(user.id, user.email);
  return res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

app.post("/auth/login", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = signToken(user.id, user.email);
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      subscriptionState: user.subscriptionState
    }
  });
});

app.get("/me", authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { user: AuthPayload }).user.sub;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  return res.json({
    id: user.id,
    email: user.email,
    subscriptionState: user.subscriptionState
  });
});

app.post("/billing/create-checkout-session", authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { user: AuthPayload }).user.sub;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    return res.status(500).json({ error: "Configuração de pagamento ausente" });
  }

  const customer = user.stripeCustomerId
    ? { id: user.stripeCustomerId }
    : await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });

  if (!user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id }
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard?checkout=cancel`
  });

  return res.json({ checkoutUrl: session.url });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
