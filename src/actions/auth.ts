"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function signIn(formData: FormData) {
  const identifier = ((formData.get("identifier") || formData.get("email")) as string || "").trim();
  const password = (formData.get("password") as string) || "";

  if (!identifier || !password) {
    return { error: "Username/Email and password are required." };
  }

  const cookieStore = await cookies();
  const admin = createAdminClient() as any;

  // 1. Verify against Gym Admin Credentials stored in Postgres (supports username or email)
  const { data: rpcRes, error: rpcError } = await admin.rpc("verify_gym_admin_login", {
    p_identifier: identifier,
    p_password: password,
  });

  if (!rpcError && rpcRes?.success) {
    const token = await createAdminSessionToken({
      gymId: rpcRes.gym_id,
      username: rpcRes.username,
      email: rpcRes.email,
      role: "owner",
      sessionVersion: Number(rpcRes.session_version || 1),
    });

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    cookieStore.delete("gymos_demo_mode");

    revalidatePath("/", "layout");
    return { success: true };
  }

  // 2. Fallback: Try Supabase Auth if identifier looks like an email
  if (identifier.includes("@")) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (!error && data.user) {
      cookieStore.delete("gymos_demo_mode");
      revalidatePath("/", "layout");
      return { success: true, user: data.user };
    }
  }

  return { error: rpcRes?.error || "Invalid username/email or password." };
}

export async function signUp(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim();
  const password = (formData.get("password") as string) || "";
  const gymName = ((formData.get("gym_name") as string) || "").trim();

  if (!email || !password || !gymName) {
    return { error: "Email, password, and Gym name are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        gym_name: gymName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const cookieStore = await cookies();
  cookieStore.delete("gymos_demo_mode");

  revalidatePath("/", "layout");
  return { success: true, user: data.user };
}

export async function signOut() {
  const cookieStore = await cookies();
  const hasSbCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token") && !!c.value);

  if (hasSbCookie) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore if no Supabase user session exists
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("gymos_demo_mode");

  revalidatePath("/", "layout");
  return { success: true };
}
