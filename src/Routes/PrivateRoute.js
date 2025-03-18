import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../services/firebaseconection";
import { onAuthStateChanged } from "firebase/auth";

const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(undefined); // 🔹 Começa como `undefined` para aguardar o Firebase
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
      setLoading(false); // 🔹 Para de carregar quando souber o estado do usuário
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Carregando...</div>; // 🔹 Mostra um carregamento até ter certeza do login
  }

  return user ? children : <Navigate to="/" />; // 🔹 Só libera acesso se o usuário estiver autenticado
};

export default PrivateRoute;
