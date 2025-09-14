
import crypto from 'crypto';

/**
 * Hash a password using a simple SHA-256 implementation 
 * Note: This is for demonstration purposes. In production, use bcrypt or Argon2
 */
export const hashPassword = async (password: string): Promise<string> => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
};
