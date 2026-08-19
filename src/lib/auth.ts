import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "ep_session";
const MAX_AGE = 60 * 60 * 12; // 12시간

function secret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [who, expStr, sig] = parts;
  const payload = `${who}.${expStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() < exp;
}

/** 비밀번호 확인 후 세션 쿠키 발급 */
export async function login(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const store = await cookies();
  store.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/** 서버 액션 맨 앞에서 호출 — 인증 안 됐으면 예외 */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("관리자 인증이 필요합니다. 다시 로그인해 주세요.");
}
