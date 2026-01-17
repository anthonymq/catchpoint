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
import { auth, isUsingMockAuth } from "@/lib/firebase";

const MOCK_USER = {
  uid: "mock-user-123",
  email: "guest@example.com",
  emailVerified: true,
  displayName: "Guest Angler",
  photoURL:
    "https://ui-avatars.com/api/?name=Guest+Angler&background=0f3460&color=fff",
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  reload: async () => {},
  getIdToken: async () => "mock-token",
} as unknown as User;

const MOCK_AUTH_STORAGE_KEY = "catchpoint_mock_user";

const getStoredMockUser = (): User | null => {
  const stored = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
};

let mockUser: User | null = getStoredMockUser();
const mockListeners = new Set<(user: User | null) => void>();

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  if (isUsingMockAuth) {
    mockListeners.add(callback);
    setTimeout(() => callback(mockUser), 0);
    return () => mockListeners.delete(callback);
  }
  return onAuthStateChanged(auth, callback);
}

const notifyMockListeners = () => {
  if (mockUser) {
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  } else {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  }
  mockListeners.forEach((callback) => callback(mockUser));
};

export async function signUp(
  email: string,
  password: string,
): Promise<{ user: User; emailSent: boolean }> {
  if (isUsingMockAuth) {
    mockUser = { ...MOCK_USER, email } as User;
    notifyMockListeners();
    return { user: mockUser, emailSent: true };
  }
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
  if (isUsingMockAuth) {
    mockUser = { ...MOCK_USER, email } as User;
    notifyMockListeners();
    return mockUser;
  }
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  return userCredential.user;
}

export async function signOut(): Promise<void> {
  if (isUsingMockAuth) {
    mockUser = null;
    notifyMockListeners();
    return;
  }
  await firebaseSignOut(auth);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export async function resendVerificationEmail(): Promise<void> {
  if (isUsingMockAuth) return;
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user signed in");
  }
  await sendEmailVerification(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (isUsingMockAuth) return;
  await sendPasswordResetEmail(auth, email);
}

export async function resetPassword(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  if (isUsingMockAuth) return;
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export function getCurrentUser(): User | null {
  if (isUsingMockAuth) return mockUser;
  return auth.currentUser;
}

export function isEmailVerified(): boolean {
  if (isUsingMockAuth) return mockUser?.emailVerified ?? false;
  return auth.currentUser?.emailVerified ?? false;
}

export async function reloadUser(): Promise<void> {
  if (isUsingMockAuth) return;
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
  if (isUsingMockAuth) {
    mockUser = { ...MOCK_USER, displayName: "Google Guest" } as User;
    notifyMockListeners();
    return { user: mockUser, isNewUser: false };
  }
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
  if (isUsingMockAuth) {
    mockUser = { ...MOCK_USER, displayName: "Apple Guest" } as User;
    notifyMockListeners();
    return { user: mockUser, isNewUser: false };
  }
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
