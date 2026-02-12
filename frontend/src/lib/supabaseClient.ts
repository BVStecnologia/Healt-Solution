import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// Cliente sem tipagem forte para permitir flexibilidade
// Os tipos serão validados em runtime
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Chama uma função RPC do Supabase
 */
export async function callRPC<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    console.error(`RPC Error [${functionName}]:`, error);
    throw error;
  }

  return data as T;
}

/**
 * Retry wrapper para chamadas de rede
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2);
  }
}

/**
 * Fetch with timeout — prevents hanging requests on slow networks
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get current Supabase session access token (for authenticated API calls)
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export { supabaseUrl, supabaseAnonKey };
