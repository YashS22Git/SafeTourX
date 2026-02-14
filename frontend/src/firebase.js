// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAQb_aLlpDZP4rZGYBmQ8BhsbT-I4EFEIY",
    authDomain: "spectax-186b3.firebaseapp.com",
    projectId: "spectax-186b3",
    storageBucket: "spectax-186b3.firebasestorage.app",
    messagingSenderId: "527293344722",
    appId: "1:527293344722:web:f59c199915c5cf1c85360b",
    measurementId: "G-PJ791JK55J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
