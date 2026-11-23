"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Clear demo mode cookie upon explicit owner login
  const cookieStore = await cookies();
  cookieStore.delete("gymos_demo_mode");

  revalidatePath("/", "layout");
  return { success: true, user: data.user };
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const gymName = formData.get("gym_name") as string;

  if (!email || !password || !gymName) {
    return { error: "Email, password, and Gym name are required" };
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
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete("gymos_demo_mode");

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleDemoMode(enabled: boolean) {
  const cookieStore = await cookies();
  if (enabled) {
    cookieStore.set("gymos_demo_mode", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
  } else {
    cookieStore.delete("gymos_demo_mode");
  }

  revalidatePath("/", "layout");
  return { success: true, isDemo: enabled };
}
