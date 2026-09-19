// lib/services/authService.ts
import { supabase } from '../supabase';

export interface StudentUser {
  id: string;
  email: string;
  fullName: string;
  rollNo?: string;
  branch: string;
  year: string;
  avatarUrl?: string;
  bio?: string;
  interests: string[];
  role: 'STUDENT' | 'ADMIN';
  verified: boolean;
}

export interface StudentRegistrationData {
  email: string;
  fullName: string;
  rollNo: string;
  branch: string;
  year: string;
  bio?: string;
  interests?: string[];
}

export const authService = {
  validateEmail(email: string): { valid: boolean; reason?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: "Please enter a valid email address." };
    }
    return { valid: true };
  },

  // Real Supabase OTP Request
  async requestOTP(email: string, metadata?: Partial<StudentRegistrationData>): Promise<{ success: boolean; message: string }> {
    const validation = this.validateEmail(email);
    if (!validation.valid) throw new Error(validation.reason);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: metadata ? {
          full_name: metadata.fullName,
          roll_no: metadata.rollNo,
          branch: metadata.branch,
          year: metadata.year,
          bio: metadata.bio || '',
          interests: metadata.interests || []
        } : undefined
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Verification OTP has been sent to your email!" };
  },

  // Real Supabase OTP Verification
  async verifyOTP(email: string, token: string) {
    if (token.length !== 6) throw new Error("Verification code must be 6 digits.");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      throw new Error(error.message);
    }

    return { session: data.session, user: data.user };
  },

  // Get Current Logged In User
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Logout
  async logout() {
    await supabase.auth.signOut();
  }
};