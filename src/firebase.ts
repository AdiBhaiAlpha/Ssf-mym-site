import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { getInitialDBState, AppDatabase } from './server/db-initial';

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Secondary Firebase credentials for Google Authentication
const secondaryFirebaseConfig = {
  apiKey: "AIzaSyBIuJFn74hJK1LT_Shcl-Y5DMgiOArB8Ps",
  authDomain: "shipu-ai.firebaseapp.com",
  projectId: "shipu-ai",
  storageBucket: "shipu-ai.firebasestorage.app",
  messagingSenderId: "953122849300",
  appId: "1:953122849300:web:f821f1a161ce7879001d01",
  measurementId: "G-N2WMSS3MNG"
};

export const secondaryApp = initializeApp(secondaryFirebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection keys mapping
const COLLECTION_KEYS = [
  'news',
  'blogs',
  'events',
  'books',
  'circulars',
  'gallery',
  'memberships',
  'logs',
  'visits',
  'organizations',
  'memberLogins',
  'invitations'
];

/**
 * Robustly seeds initial data to Firestore.
 */
async function seedInitialData() {
  const initial = getInitialDBState();
  console.log('Seeding initial database state to Firestore...');

  try {
    // 1. Seed settings
    await setDoc(doc(db, 'settings', 'webSettings'), initial.settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/webSettings');
  }

  // 2. Seed other collections in batches
  for (const colName of COLLECTION_KEYS) {
    const arr = initial[colName as keyof AppDatabase] as any[];
    if (arr && arr.length > 0) {
      for (const item of arr) {
        if (item.id) {
          try {
            await setDoc(doc(db, colName, item.id), item);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `${colName}/${item.id}`);
          }
        }
      }
    }
  }

  try {
    // 3. Set initialized state flag doc
    await setDoc(doc(db, 'settings', 'initialized'), { seededAt: new Date().toISOString() });
    console.log('Firestore Database successfully seeded!');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/initialized');
  }
}

/**
 * Fetches the entire application state from Firestore, automatically seeding it
 * from initial sample data if it has not been initialized.
 */
export async function fetchFirestoreDatabase(): Promise<AppDatabase> {
  let initCheckExists = false;
  try {
    // Check if initialized doc already exists
    const initCheck = await getDoc(doc(db, 'settings', 'initialized'));
    initCheckExists = initCheck.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/initialized');
  }

  if (!initCheckExists) {
    await seedInitialData();
  }

  const appDb: Partial<AppDatabase> = {};

  try {
    // Fetch settings and all collections in parallel to hit minimum loading time under 1 second
    const settingsPromise = getDoc(doc(db, 'settings', 'webSettings'));
    
    const collectionPromises = COLLECTION_KEYS.map(async (colName) => {
      try {
        const querySnapshot = await getDocs(collection(db, colName));
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data() });
        });
        return { colName, list };
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, colName);
      }
    });

    const [settingsDoc, ...collectionsResults] = await Promise.all([
      settingsPromise,
      ...collectionPromises
    ]);

    // Parse webSettings
    if (settingsDoc.exists()) {
      appDb.settings = settingsDoc.data() as any;
    } else {
      appDb.settings = getInitialDBState().settings;
    }

    // Parse parallel collection results
    for (const res of collectionsResults) {
      if (res) {
        appDb[res.colName as keyof AppDatabase] = res.list as any;
      }
    }
  } catch (error) {
    console.error('Parallel database fetch failed, running sequential fallback', error);
    throw error;
  }

  return appDb as AppDatabase;
}

/**
 * Saves or updates a document in a given Firestore collection.
 */
export async function saveFirestoreDoc(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

/**
 * Deletes a document from a given Firestore collection.
 */
export async function deleteFirestoreDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

/**
 * Resets Firestore database back to sample/initial states.
 */
export async function resetFirestoreDatabase(): Promise<void> {
  const initial = getInitialDBState();
  
  try {
    // Save settings
    await setDoc(doc(db, 'settings', 'webSettings'), initial.settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/webSettings');
  }

  // Clear existing items in other collections and re-write initial
  for (const colName of COLLECTION_KEYS) {
    try {
      const qs = await getDocs(collection(db, colName));
      for (const d of qs.docs) {
        await deleteDoc(doc(db, colName, d.id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, colName);
    }

    const arr = initial[colName as keyof AppDatabase] as any[];
    if (arr && arr.length > 0) {
      for (const item of arr) {
        if (item.id) {
          try {
            await setDoc(doc(db, colName, item.id), item);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `${colName}/${item.id}`);
          }
        }
      }
    }
  }
}


