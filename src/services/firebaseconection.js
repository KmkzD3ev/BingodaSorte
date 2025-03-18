
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword ,signOut} from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyDaOCpTLUK6KU4j661eOrvWX2A-WYcs9VE",
    authDomain: "bingodasorte20.firebaseapp.com",
    projectId: "bingodasorte20",
    storageBucket: "bingodasorte20.firebasestorage.app",
    messagingSenderId: "310550047923",
    appId: "1:310550047923:web:bf0cfc8bc348ba1eb554c6",
    measurementId: "G-9GJD6CQL99"
  };

  const firebaseapp = initializeApp(firebaseConfig);

  const db =  getFirestore(firebaseapp)

  const auth = getAuth(firebaseapp)

  const  storage = getStorage(firebaseapp)

  export {db,auth,storage,signInWithEmailAndPassword,signOut};
