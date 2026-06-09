/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqwGhkBL7VdFoSk72LnG7hRG848zUzoUs";
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tech-gadgets-kenya.firebaseapp.com";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "tech-gadgets-kenya";

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket: "tech-gadgets-kenya.firebasestorage.app",
  messagingSenderId: "937704899601",
  appId: "1:937704899601:web:f2ddecafdfe118daf89db0",
  measurementId: "G-VKLHREQ9PN",
  firestoreDatabaseId: "(default)"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)"); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Logged: ", JSON.stringify(errInfo));
  if (operationType === OperationType.LIST || operationType === OperationType.GET) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}
