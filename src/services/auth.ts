import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ user: User; emailSent: boolean }> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  let emailSent = false;
  try {
    await sendEmailVerification(user);
    emailSent = true;
  } catch (error) {
    console.error("[Auth] Failed to send verification email:", error);
  }

  return { user, emailSent };
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user signed in");
  }
  await sendEmailVerification(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function resetPassword(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function isEmailVerified(): boolean {
  return auth.currentUser?.emailVerified ?? false;
}

export async function reloadUser(): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    await user.reload();
  }
}
