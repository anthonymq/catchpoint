import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  type User,
  type AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

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

export interface SocialAuthResult {
  user: User;
  isNewUser: boolean;
}

async function handleAccountLinking(
  error: AuthError,
  pendingCredential: ReturnType<typeof GoogleAuthProvider.credentialFromError>,
): Promise<User> {
  if (
    error.code !== "auth/account-exists-with-different-credential" ||
    !pendingCredential
  ) {
    throw error;
  }

  const email = (error as AuthError & { customData?: { email?: string } })
    .customData?.email;
  if (!email) {
    throw error;
  }

  const existingMethods = await fetchSignInMethodsForEmail(auth, email);

  if (existingMethods.includes("google.com")) {
    const result = await signInWithPopup(auth, googleProvider);
    await linkWithCredential(result.user, pendingCredential);
    return result.user;
  } else if (existingMethods.includes("apple.com")) {
    const result = await signInWithPopup(auth, appleProvider);
    await linkWithCredential(result.user, pendingCredential);
    return result.user;
  }

  throw error;
}

export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const isNewUser =
      result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
    return { user: result.user, isNewUser };
  } catch (error) {
    const authError = error as AuthError;
    const pendingCredential = GoogleAuthProvider.credentialFromError(authError);
    const user = await handleAccountLinking(authError, pendingCredential);
    return { user, isNewUser: false };
  }
}

export async function signInWithApple(): Promise<SocialAuthResult> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const isNewUser =
      result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
    return { user: result.user, isNewUser };
  } catch (error) {
    const authError = error as AuthError;
    const pendingCredential = OAuthProvider.credentialFromError(authError);
    const user = await handleAccountLinking(authError, pendingCredential);
    return { user, isNewUser: false };
  }
}
