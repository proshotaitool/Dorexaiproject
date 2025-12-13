'use server';

import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { createHash } from 'crypto';

// Environment variables should be securely set in .env.local
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dorexai.space';
// In a real app, hash the password! For now we compare plain text as requested or use env.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || 'ishu2008';

const OTP_SECRET_SALT = process.env.OTP_SECRET_SALT || 'random_salt_change_me';

// --- Helper Functions ---

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp + OTP_SECRET_SALT).digest('hex');
}

async function sendOtpEmail(otp: string) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass || emailUser.includes('your_email')) {
    console.log('EMAIL CONFIG MISSING OR DUMMY. DEV MODE OTP:', otp);
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    throw new Error('Email service not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"DorexAI Security" <${emailUser}>`,
      to: ADMIN_EMAIL, // Send to the admin's email
      subject: 'Your Admin Access OTP',
      text: `Your verification code for DorexAI Admin Panel is: ${otp}`,
      html: `<p>Your verification code for <b>DorexAI Admin Panel</b> is:</p><h2>${otp}</h2><p>This code expires in 5 minutes.</p>`,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('DEV MODE BYPASS: Email failed, but proceeding. OTP was:', otp);
      return true;
    }
    throw error;
  }
}

// --- Server Actions ---

// Step 1: Login
export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Set a temporary cookie to indicate level 1 passed
    (await cookies()).set('admin_step', 'code_pending', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 300, // 5 mins to complete next step
    });
    return { success: true };
  }
  return { success: false, error: 'Invalid email or password' };
}

// Step 2: Secret Code
export async function verifyCodeAndSendOtp(code: string) {
  const cookieStore = await cookies();
  const step = cookieStore.get('admin_step')?.value;

  if (step !== 'code_pending') {
    return { success: false, error: 'Session expired or invalid flow result. Please login again.' };
  }

  if (code.trim() === ADMIN_SECRET_CODE) {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOtpEmail(otp);

      // Store OTP hash in cookie
      const otpHash = hashOtp(otp);

      (await cookies()).set('admin_otp_hash', otpHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 300, // 5 mins expiry
      });

      // Update step
      (await cookies()).set('admin_step', 'otp_pending', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 300,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Invalid login') || errorMessage.includes('Username and Password not accepted')) {
        return { success: false, error: 'Email Auth Failed. Check EMAIL_USER/PASS in .env.local' };
      }
      return { success: false, error: 'Failed to send OTP email. ' + errorMessage };
    }
  }

  return { success: false, error: 'Invalid security code' };
}

// Step 3: Verify OTP
export async function verifyOtpAndGrantAccess(otp: string) {
  const cookieStore = await cookies();
  const step = cookieStore.get('admin_step')?.value;
  const storedHash = cookieStore.get('admin_otp_hash')?.value;

  if (step !== 'otp_pending' || !storedHash) {
    return { success: false, error: 'Session expired. Please restart login.' };
  }

  const inputHash = hashOtp(otp);

  if (inputHash === storedHash) {
    // SUCCESS! Grant final access

    // Clean up temp cookies
    cookieStore.delete('admin_step');
    cookieStore.delete('admin_otp_hash');

    // Set final session cookie
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { success: true };
  }

  return { success: false, error: 'Invalid OTP' };
}

// Step 4: Resend OTP
export async function resendOtp() {
  const cookieStore = await cookies();
  const step = cookieStore.get('admin_step')?.value;

  if (step !== 'otp_pending') {
    return { success: false, error: 'Session expired. Please restart login.' };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await sendOtpEmail(otp);

    // Store new OTP hash in cookie
    const otpHash = hashOtp(otp);

    cookieStore.set('admin_otp_hash', otpHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 300, // Reset 5 mins expiry
    });

    // Refresh step cookie time
    cookieStore.set('admin_step', 'otp_pending', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 300,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to resend OTP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: 'Failed to resend OTP. ' + errorMessage };
  }
}

// Legacy/Helper Check
export async function checkAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.has('admin_session');
}

// Legacy Verification (Keep for compatibility if verify-admin page used it directly, 
// ensuring we don't break things before we update the frontend completely)
export async function verifyAdminCode(code: string) {
  return (code === ADMIN_SECRET_CODE);
}
