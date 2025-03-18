import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebaseconection";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// 🔹 Criando o Contexto
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null); // 🔹 Adicionando o UID ao estado global
  const [saldo, setSaldo] = useState(0.00);
  const [cartelas, setCartelas] = useState([]); 

  // 🔹 Verifica se o usuário está autenticado e busca os dados no Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (loggedUser) {
        const userDocRef = doc(db, "usuarios", loggedUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(userDocSnap.data().nome);
          setUid(loggedUser.uid); // 🔹 Armazena o UID
          setSaldo(userDocSnap.data().saldo);
          setCartelas(userDocSnap.data().cartelas || []);
        }
      } else {
        setUser(null);
        setUid(null); // 🔹 Reseta o UID quando o usuário deslogar
        setSaldo(0.00);
        setCartelas([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, uid, saldo, setSaldo, cartelas, setCartelas }}>
      {children}
    </UserContext.Provider>
  );
};
