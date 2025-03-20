import { createClient, SupabaseClient, PostgrestError, AuthError } from '@supabase/supabase-js';

// Environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables at runtime
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persist session across page reloads
  },
});

// Interface for auth response
interface AuthResponse {
  data: any; // Adjust this based on the specific response type you expect
  error: AuthError | null;
}

// Interface for database query response
interface DatabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
    }
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during Google sign-in:', error);
    return { data: null, error: error as AuthError };
  }
}

// Sign in with phone (OTP)
export async function signInWithPhone(phone: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) {
      console.error('Phone sign-in error:', error.message);
    }
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during phone sign-in:', error);
    return { data: null, error: error as AuthError };
  }
}

// Verify phone OTP
export async function verifyOTP(phone: string, token: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) {
      console.error('OTP verification error:', error.message);
    }
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during OTP verification:', error);
    return { data: null, error: error as AuthError };
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: Record<string, any>
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Email sign-up error:', error.message);
    }
    return { data, error };
  } catch (error) {
    console.error('Unexpected error during email sign-up:', error);
    return { data: null, error: error as AuthError };
  }
}