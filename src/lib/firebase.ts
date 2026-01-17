import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(firestore).catch((error) => {
  if (error.code === "failed-precondition") {
    console.warn("[Firestore] Persistence unavailable: multiple tabs open");
  } else if (error.code === "unimplemented") {
    console.warn("[Firestore] Persistence unavailable: browser not supported");
  }
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("[Firebase] Failed to set persistence:", error);
});

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(
    auth,
    `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  console.log("[Firebase] Connected to Auth emulator");
}

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST
) {
  const [host, port] =
    import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(firestore, host, parseInt(port, 10));
  console.log("[Firebase] Connected to Firestore emulator");
}

if (
  import.meta.env.DEV &&
  import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST
) {
  const [host, port] =
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST.split(":");
  connectStorageEmulator(storage, host, parseInt(port, 10));
  console.log("[Firebase] Connected to Storage emulator");
}

export { app, auth, firestore, storage };
