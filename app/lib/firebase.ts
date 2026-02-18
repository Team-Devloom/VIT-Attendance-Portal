import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDa-onHVzLmxsUEqqq0M75V39nYbTcwiic",
  authDomain: "vit-attendance-15f1e.firebaseapp.com",
  projectId: "vit-attendance-15f1e",
  storageBucket: "vit-attendance-15f1e.firebasestorage.app",
  messagingSenderId: "666429516573",
  appId: "1:666429516573:web:756a6fa4d1546daee38ff4",
  measurementId: "G-YMETJ941K4",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence);
