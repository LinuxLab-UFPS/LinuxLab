import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

/** True when the minimum Firebase web config is present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
)

let cached: { auth: Auth; googleProvider: GoogleAuthProvider } | null = null

/**
 * Lazily initialize Firebase.
 *
 * Kept out of module load on purpose: initializing with a missing config throws,
 * and since the auth context is mounted app-wide, doing it eagerly would crash
 * the entire app whenever `.env.local` is absent. This way the app boots fine
 * and only actually logging in surfaces a clear "not configured" error.
 */
export function getFirebaseAuth(): { auth: Auth; googleProvider: GoogleAuthProvider } {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase no está configurado. Copia .env.example a .env.local y completa las variables NEXT_PUBLIC_FIREBASE_*.",
    )
  }
  if (!cached) {
    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
    cached = { auth: getAuth(app), googleProvider: new GoogleAuthProvider() }
  }
  return cached
}
