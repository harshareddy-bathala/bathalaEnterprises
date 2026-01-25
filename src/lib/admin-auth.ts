import { supabase } from "./supabase-client";

export async function signUpAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        is_admin: true
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signInAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Check if user has admin role
  if (data.user?.user_metadata?.is_admin) {
    return data;
  }

  // Sign out if not admin
  await supabase.auth.signOut();
  throw new Error("User does not have admin privileges");
}

export async function signOutAdmin() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getAdminUser() {
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  
  if (data.user?.user_metadata?.is_admin) {
    return data.user;
  }

  return null;
}

export async function checkAdminSession() {
  if (!supabase) return false;

  const { data } = await supabase.auth.getSession();
  return data.session ? true : false;
}
