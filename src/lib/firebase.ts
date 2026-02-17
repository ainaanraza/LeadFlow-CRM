import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if config is present or an app already exists
let app;
let auth: any;
let db: any;
let storage: any;

if (getApps().length > 0) {
    app = getApps()[0];
} else if (
    firebaseConfig.apiKey &&
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.apiKey.length > 0
) {
    try {
        app = initializeApp(firebaseConfig);
    } catch (e) {
        console.warn('Firebase initialization failed (this is expected during build if env vars are missing):', e);
    }
}

// Export services if app is initialized, otherwise undefined (prevents build crash)
if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { auth, db, storage };
export default app;
