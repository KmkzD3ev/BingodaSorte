import React, { useEffect } from "react";
import "./CartelaBingo.css";
import { db } from "../services/firebaseconection";
import { doc, setDoc, collection } from "firebase/firestore";
import { UserContext } from "../contexts/UserContext";
import { useContext } from "react";

const CartelaBingo = ({ numeros, idCartela,numerosSorteados }) => {
  const { user } = useContext(UserContext); // Obtendo usuário do contexto global



  // 🔥 GARANTE QUE OS DADOS ESTÃO OK ANTES DE RENDERIZAR
  if (!Array.isArray(numeros) || numeros.length !== 5 || 
      numeros.some(row => !Array.isArray(row) || row.length !== 5)) {
    console.error(`❌ ERRO: Dados inválidos recebidos para Cartela ID ${idCartela}:`, numeros);
    return <div className="cartela-bingo-placeholder">⚠️ Erro ao carregar cartela...</div>;
  }

  




  return (
    <div className="cartela-bingo">
      <div className="cartela-header">
        <span className="cartela-titulo">Cartela N°: {idCartela}</span>
      </div>

      <div className="cartela-grid">
  {numeros.map((linha, i) => (
    <div key={i} className="cartela-linha">
      {linha.map((num, j) => {
        const estaSorteado = numerosSorteados.includes(num); // 🔥 Verifica se o número foi sorteado
        return (
          <span 
            key={`${i}-${j}`} 
            className={`cartela-numero ${estaSorteado ? "marcado" : ""}`} // 🔥 Aplica classe CSS para destacar número sorteado
          >
            {num.toString().padStart(2, "0")}
          </span>
        );
      })}
    </div>
  ))}
</div>

    </div>
  );
};

export default CartelaBingo;
