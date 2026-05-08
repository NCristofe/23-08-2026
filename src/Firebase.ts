import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCdsUb7yvvPEDmftPgT8QmhFDf63gJJtxg",
  authDomain: "nosso-amor-230825.firebaseapp.com",
  projectId: "nosso-amor-230825",
  storageBucket: "nosso-amor-230825.firebasestorage.app",
  messagingSenderId: "591144523973",
  appId: "1:591144523973:web:aab33eaf7a3ab81a7ef8ac",
};

const app = initializeApp(firebaseConfig);;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

