import React, { createContext, useState, useEffect } from "react";
import { db } from "../services/firebaseconection";
import { collection, getDocs } from "firebase/firestore";

// Criando o Contexto do Bingo
export const BingoContext = createContext();

export const BingoProvider = ({ children }) => {
  const [cartelas, setCartelas] = useState([]); 
  const [numerosSorteados, setNumerosSorteados] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [numeroAtual, setNumeroAtual] = useState(null);
  // 🔥 Estado para receber comando externo de início do sorteio
const [iniciarSorteioExterno, setIniciarSorteioExterno] = useState(false);

  


  useEffect(() => {
    const carregarCartelas = async () => {
      try {
        console.log("🔄 Buscando usuários dentro da coleção 'cartelas'...");
  
        const usuariosSnapshot = await getDocs(collection(db, "cartelas"));
        let todasCartelas = [];
  
        if (usuariosSnapshot.empty) {
          console.warn("⚠️ Nenhum usuário encontrado na coleção 'cartelas'.");
          return;
        }
  
        for (const usuarioDoc of usuariosSnapshot.docs) {
          const userId = usuarioDoc.id;
          console.log(`👤 Usuário encontrado: ${userId}`);
  
          try {
            const userCartelasRef = collection(db, "cartelas", userId, "userCartelas");
            const cartelasSnapshot = await getDocs(userCartelasRef);
  
            if (cartelasSnapshot.empty) {
              console.warn(`⚠️ Usuário ${userId} não tem cartelas cadastradas.`);
              continue; // Passa para o próximo usuário
            }
  
            cartelasSnapshot.forEach(cartelaDoc => {
              const cartelaData = {
                id: cartelaDoc.id,
                dono: userId,
                ...cartelaDoc.data(),
              };
              console.log(`📄 Cartela carregada para usuário ${userId}:`, cartelaData);
              todasCartelas.push(cartelaData);
            });
          } catch (error) {
            console.error(`❌ Erro ao buscar cartelas do usuário ${userId}:`, error);
          }
        }
  
        if (todasCartelas.length === 0) {
          console.warn("⚠️ Nenhuma cartela foi encontrada para nenhum usuário.");
        } else {
          console.log("✅ Todas as cartelas carregadas:", todasCartelas);
        }
  
        setCartelas(todasCartelas);
      } catch (error) {
        console.error("❌ Erro ao carregar cartelas:", error);
      }
    };
  
    carregarCartelas();
  }, []);
  

  return (
    <BingoContext.Provider
      value={{
        cartelas,
        numerosSorteados,
        setNumerosSorteados,
        sorteando,
        setSorteando,
        numeroAtual,
        setNumeroAtual,
        iniciarSorteioExterno, // 🔥 Adicionando a variável no Contexto
        setIniciarSorteioExterno, // 🔥 Permite alterar esse estado de qualquer componente
      }}
    >
      {children}
    </BingoContext.Provider>
  );
};
