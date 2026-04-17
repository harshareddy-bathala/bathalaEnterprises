import { supabase } from "./supabase-client";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: {
    is_admin?: boolean;
    full_name?: string;
    name?: string;
    avatar_url?: string | null;
    mfa_preferred_method?: string;
    mfa_backup_email?: string | null;
    mfa_enabled?: boolean;
    [key: string]: unknown;
  } | null;
};

const ADMIN_USER_CACHE_TTL_MS = 45_000;

let cachedAdminUser: AuthUserLike | null = null;
let cachedAdminUserId: string | null = null;
let adminUserCacheExpiresAt = 0;
let inFlightAdminLookup: Promise<AuthUserLike | null> | null = null;

function clearAdminUserCache() {
  cachedAdminUser = null;
  cachedAdminUserId = null;
  adminUserCacheExpiresAt = 0;
  inFlightAdminLookup = null;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts: string[] = [];
    if (typeof record.message === "string" && record.message.trim()) {
      parts.push(record.message.trim());
    }
    if (typeof record.details === "string" && record.details.trim()) {
      parts.push(record.details.trim());
    }
    if (typeof record.hint === "string" && record.hint.trim()) {
      parts.push(`Hint: ${record.hint.trim()}`);
    }
    if (typeof record.code === "string" && record.code.trim()) {
      parts.push(`Code: ${record.code.trim()}`);
    }

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return "Unknown error";
}

function isSchemaNotReadyMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache") ||
    normalized.includes("function")
  );
}

async function checkAdminByRpc(): Promise<boolean | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("is_admin_user");

  if (error) {
    const message = toErrorMessage(error);
    if (isSchemaNotReadyMessage(message)) {
      return null;
    }

    console.warn("Admin RPC check failed:", message);
    return null;
  }

  return typeof data === "boolean" ? data : null;
}

async function checkAdminByTable(userId: string): Promise<boolean | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    const message = toErrorMessage(error);
    if (isSchemaNotReadyMessage(message)) {
      return null;
    }

    console.warn("Admin table check failed:", message);
    return null;
  }

  if (!data) {
    return false;
  }

  return Boolean(data.is_active);
}

async function isAdminUser(user: AuthUserLike | null | undefined): Promise<boolean> {
  if (!user) {
    return false;
  }

  const rpcResult = await checkAdminByRpc();
  if (rpcResult !== null) {
    return rpcResult;
  }

  const tableResult = await checkAdminByTable(user.id);
  if (tableResult !== null) {
    return tableResult;
  }

  return false;
}

export async function signUpAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

  if (await isAdminUser(data.user as AuthUserLike | null)) {
    clearAdminUserCache();
    return data;
  }

  await supabase.auth.signOut();
  throw new Error("User does not have admin privileges");
}

export async function signOutAdmin() {
  clearAdminUserCache();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getAdminUser() {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const sessionUser = session?.user as AuthUserLike | null;
  if (!sessionUser) {
    clearAdminUserCache();
    return null;
  }

  if (
    cachedAdminUserId === sessionUser.id &&
    adminUserCacheExpiresAt > Date.now()
  ) {
    return cachedAdminUser;
  }

  if (!inFlightAdminLookup) {
    inFlightAdminLookup = (async () => {
      const isAdmin = await isAdminUser(sessionUser);
      const nextValue = isAdmin ? sessionUser : null;

      cachedAdminUser = nextValue;
      cachedAdminUserId = sessionUser.id;
      adminUserCacheExpiresAt = Date.now() + ADMIN_USER_CACHE_TTL_MS;
      inFlightAdminLookup = null;

      return nextValue;
    })().catch((error) => {
      clearAdminUserCache();
      throw error;
    });
  }

  return inFlightAdminLookup;
}

export async function checkAdminSession() {
  if (!supabase) return false;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return false;
  }

  const user = await getAdminUser();
  return Boolean(user);
}
