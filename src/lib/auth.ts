import { supabase } from './supabase';

// User signup function
export async function signUpWithEmail(email: string, password: string, metadata: any) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error.message);
    return { data: null, error };
  }
}

// User login function
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error.message);
    return { data: null, error };
  }
}

// Google OAuth sign in
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error.message);
    return { data: null, error };
  }
}

// Phone authentication
export async function signInWithPhone(phone: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with phone:', error.message);
    return { data: null, error };
  }
}

// Verify OTP
export async function verifyOTP(phone: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error verifying OTP:', error.message);
    return { data: null, error };
  }
}

// Password reset request
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error resetting password:', error.message);
    return { data: null, error };
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating password:', error.message);
    return { data: null, error };
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error.message);
    return { error };
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting session:', error.message);
    return { data: null, error };
  }
}

// Determine user type (builder or customer)
export async function determineUserType(userId: string): Promise<'builder' | 'customer' | null> {
  try {
    // Check if user exists in builders table
    const { data: builderData, error: builderError } = await supabase
      .from('builders')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (builderError && builderError.code !== 'PGRST116') {
      throw builderError;
    }
    
    if (builderData) return 'builder';
    
    // Check if user exists in customers table
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      throw customerError;
    }
    
    if (customerData) return 'customer';
    
    return null;
  } catch (error: any) {
    console.error('Error determining user type:', error.message);
    return null;
  }
}

// Get user profile based on type
export async function getUserProfile(userId: string, userType: 'builder' | 'customer') {
  try {
    const table = userType === 'builder' ? 'builders' : 'customers';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching user profile:', error.message);
    return { data: null, error };
  }
}


export async function fetchAllProjects() {
  try {
    const { data, error } = await supabase.from("projects").select("*");

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error fetching projects:", error.message);
    return { data: null, error };
  }
}


export async function fetchUserProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error fetching user projects:", error.message);
    return { data: null, error };
  }
}


export async function addProject(project: {
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  completion: number;
  user_id: string;
}) {
  try {
    const { data, error } = await supabase.from("projects").insert([project]);

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error("Error adding project:", error.message);
    return { data: null, error };
  }
}
