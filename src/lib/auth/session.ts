export const SESSION_COOKIE_NAME = "gymos_admin_session";
export const DEFAULT_GYM_ID =
  process.env.NEXT_PUBLIC_DEMO_GYM_ID || "00000000-0000-0000-0000-000000000001";

export interface AdminSessionPayload {
  gymId: string;
  username: string;
  email: string;
  role: "owner" | "manager" | "reception";
  sessionVersion: number;
  exp: number;
}

function getSessionSecret(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const validServiceKey =
    serviceKey && !serviceKey.startsWith("placeholder") && !serviceKey.startsWith("your_")
      ? serviceKey
      : null;

  return (
    process.env.AUTH_SECRET ||
    validServiceKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "fitness-planet-sikandrabad-gymos-session-secret-2026"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signHmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export async function createAdminSessionToken(
  payload: Omit<AdminSessionPayload, "exp">,
  ttlSeconds: number = 60 * 60 * 24 * 7
): Promise<string> {
  const fullPayload: AdminSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signature = await signHmac(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  try {
    const expectedSig = await signHmac(encodedPayload);
    if (providedSig.length !== expectedSig.length) return null;

    // Constant-time string comparison
    let diff = 0;
    for (let i = 0; i < providedSig.length; i++) {
      diff |= providedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const decoded = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const parsed = JSON.parse(decoded) as AdminSessionPayload;

    if (!parsed.gymId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
