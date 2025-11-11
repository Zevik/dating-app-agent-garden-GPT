import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, type Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAw7_JP9TYfiRThkWhewT5CxkuzbuAwak4',
  authDomain: 'dating-app-agent-garden-gpt.firebaseapp.com',
  projectId: 'dating-app-agent-garden-gpt',
  storageBucket: 'dating-app-agent-garden-gpt.appspot.com',
  messagingSenderId: '694036569433',
  appId: '1:694036569433:web:8625f801a18d934d740048',
  measurementId: 'G-MKT1P71J3Z'
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

let messaging: Messaging | null = null;

async function ensureMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;
  if (typeof window === 'undefined') return null;
  if (await isSupported()) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
}

export { app, auth, firestore, storage, ensureMessaging, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
