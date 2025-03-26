// src/contexts/SorteioContext.js
import React, { createContext, useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseconection";
import { useNavigate, useLocation } from "react-router-dom";

export const SorteioContext = createContext();

export const SorteioProvider = ({ children }) => {
  const [sorteioId, setSorteioId] = useState(null);
  const [sorteioIniciado, setSorteioIniciado] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verificarSorteio = async () => {
      try {
        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        snapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          const [h, m] = data.hora.split(":").map(Number);
          const agora = new Date();
          const horarioSorteio = new Date();
          horarioSorteio.setHours(h, m, 0, 0);

          const diffMinutos = (agora - horarioSorteio) / 60000;

          if (diffMinutos >= 0 && diffMinutos <= 1) {
            const id = docSnap.id;
            setSorteioId(id);

            const docRef = doc(db, "sorteios_agendados", id);
            const sorteioDetalhado = await getDoc(docRef);

            if (sorteioDetalhado.exists()) {
              const dados = sorteioDetalhado.data();
              setSorteioIniciado(dados.iniciado);

              if (dados.iniciado && location.pathname !== "/PrincipalSorteio") {
                console.log("🔁 Redirecionando para o sorteio via CONTEXT");
                alert("🎯 Sorteio iniciado! Redirecionando...");
                navigate("/PrincipalSorteio");
              }
            }
          }
        });
      } catch (err) {
        console.error("❌ Erro ao verificar sorteio no context:", err);
      }
    };

    verificarSorteio();
    const interval = setInterval(verificarSorteio, 1000);
    return () => clearInterval(interval);
  }, [navigate, location]);

  return (
    <SorteioContext.Provider value={{ sorteioId, sorteioIniciado }}>
      {children}
    </SorteioContext.Provider>
  );
};
