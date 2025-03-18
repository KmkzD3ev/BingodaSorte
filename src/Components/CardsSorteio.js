import React, { useState, useEffect } from "react";
import { db } from "../services/firebaseconection";  
import { doc, getDoc } from "firebase/firestore";
import "./CardsSorteio.css"; // 🔥 Importa o CSS dos cards

const CardsSorteio = () => {
  const [dadosSorteio, setDadosSorteio] = useState(null);

  useEffect(() => {
    const buscarDadosSorteio = async () => {
      try {
        const docRef = doc(db, "config", "dadosSorteio");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDadosSorteio(docSnap.data());
        } else {
          console.log("❌ Nenhum dado encontrado no Firestore.");
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do sorteio:", error);
      }
    };

    buscarDadosSorteio();
  }, []);

  if (!dadosSorteio) {
    return <p>🔄 Carregando informações do sorteio...</p>;
  }

  return (
    <div className="cards-container">
      
      {/* 🔹 Cards Superiores (Acumulado e Prêmios) */}
      <div className="cards-superior">
        <div className="card destaque">
          <h3>ACUMULADO</h3>
          <span className="valor destaque">R$ {dadosSorteio.acumulado.toFixed(2)}</span>
        </div>

        <div className="card">
          <h3>QUADRA</h3>
          <span className="valor">R$ {dadosSorteio.primeiro.toFixed(2)}</span>
        </div>

        <div className="card inativo">
          <h3>QUINA</h3>
          <span className="valor">R$ {dadosSorteio.segundo.toFixed(2)}</span>
        </div>

        <div className="card inativo">
          <h3>CARTELA CHEIA</h3>
          <span className="valor">R$ {dadosSorteio.terceiro.toFixed(2)}</span>
        </div>
      </div>

      {/* 🔹 Cards Laterais (Sorteio, Doação, Data, Hora) */}
      <div className="cards-lateral">
        <div className="card">
          <h3>SORTEIO</h3>
          <span className="valor">053438</span>
        </div>

        <div className="card">
          <h3>DATA</h3>
          <span className="valor">26/02/2025</span>
        </div>

        <div className="card">
          <h3>HORA</h3>
          <span className="valor">17:30</span>
        </div>
      </div>
      
    </div>
  );
};

export default CardsSorteio;
