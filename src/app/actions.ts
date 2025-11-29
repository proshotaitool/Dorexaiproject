'use server';

import { cookies } from 'next/headers';

export async function verifyAdminCode(code: string) {
  // Securely compare the provided code with the server-side environment variable
  const secret = process.env.ADMIN_SECRET_CODE || 'ishu2008';

  if (code?.trim() === secret.trim()) {
    // Set a secure, HTTP-only cookie to establish the admin session
    (await cookies()).set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return true;
  }
  return false;
}

export async function checkAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.has('admin_session');
}
