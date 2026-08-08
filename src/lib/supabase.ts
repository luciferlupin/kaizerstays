import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginWithSupabase(email: string, pass: string) {
  try {
    if (supabaseUrl.includes("placeholder")) {
      // Local fallback check for Owner
      if (email.toLowerCase() === "ninaad.khera@gmail.com" && pass === "12345") {
        return {
          success: true,
          user: {
            id: "owner_001",
            email: "Ninaad.khera@gmail.com",
            name: "Ninaad Khera",
            role: "Property Owner & GM",
          },
        };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      // Check hardcoded owner credentials fallback
      if (email.toLowerCase() === "ninaad.khera@gmail.com" && pass === "12345") {
        return {
          success: true,
          user: {
            id: "owner_001",
            email: "Ninaad.khera@gmail.com",
            name: "Ninaad Khera",
            role: "Property Owner & GM",
          },
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    if (email.toLowerCase() === "ninaad.khera@gmail.com" && pass === "12345") {
      return {
        success: true,
        user: {
          id: "owner_001",
          email: "Ninaad.khera@gmail.com",
          name: "Ninaad Khera",
          role: "Property Owner & GM",
        },
      };
    }
    return { success: false, error: err.message };
  }
}
