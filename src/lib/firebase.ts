// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDXVvzov9AUbFnEUYLhdLcgckmSIEjtoQ",
  authDomain: "churn-predik.firebaseapp.com",
  projectId: "churn-predik",
  storageBucket: "churn-predik.firebasestorage.app",
  messagingSenderId: "315894758937",
  appId: "1:315894758937:web:3be32f61103b5e17d7f488",
  measurementId: "G-W0EQJPFHK7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
