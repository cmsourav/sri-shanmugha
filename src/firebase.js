import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARJPYpCT4BVPP6GbCsjgenO6e5Fn-ox2g",
  authDomain: "km-web-5fea0.firebaseapp.com",
  projectId: "km-web-5fea0",
  storageBucket: "km-web-5fea0.firebasestorage.app",
  messagingSenderId: "189422355169",
  appId: "1:189422355169:web:d33edd6cc0a02d31d5ada0",
  measurementId: "G-QBTHYVT4G2"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };