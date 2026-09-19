// lib/services/authService.ts
import { APP_CONFIG } from '../config';

export interface StudentUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
  branch: string;
  year: string;
  avatarUrl?: string;
  bio?: string;
  interests: string[];
  role: 'STUDENT' | 'ADMIN';
  verified: boolean;
}

export const authService = {
  validateEmail(email: string): { valid: boolean; reason?: string } {
    if (!APP_CONFIG.EMAIL_REGEX.test(email)) {
      return { valid: false, reason: "That's not an email. Nice try though." };
    }
    const domain = email.split('@')[1]?.toLowerCase();
    const isAllowed = APP_CONFIG.ALLOWED_COLLEGE_EMAIL_DOMAINS.some(
      allowed => domain === allowed || domain.endsWith(`.${allowed}`)
    );
    if (!isAllowed) {
      return { 
        valid: false, 
        reason: "MBMChat is a little exclusive. Please use your valid MBM University student email." 
      };
    }
    return { valid: true };
  },

  async requestOTP(email: string): Promise<{ success: boolean; message: string }> {
    // Contract for POST /api/v1/auth/request-otp
    const validation = this.validateEmail(email);
    if (!validation.valid) throw new Error(validation.reason);
    
    // Simulating verified transmission contract
    return { success: true, message: "We sent a verification code. Yes, email still has one job." };
  },

  async verifyOTP(email: string, otp: string): Promise<{ token: string; user?: StudentUser }> {
    // Contract for POST /api/v1/auth/verify-otp
    if (otp.length !== 6) throw new Error("Verification codes are 6 digits. Don't improvise.");
    return { token: "mock_jwt_token_prod_ready", user: undefined };
  },

  async checkUsername(username: string): Promise<boolean> {
    // Contract for GET /api/v1/users/check-username?u=...
    return username.length >= 3 && !['admin', 'mbm', 'root'].includes(username.toLowerCase());
  }
};