import React, { useState, useEffect } from "react";
import { db } from "../services/firebaseconection";  
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import "./CardsSorteio.css"; // 🔥 Importa o CSS dos cards

const CardsSorteio = () => {
  const [dadosSorteio, setDadosSorteio] = useState(null);
  const [horaAgendada, setHoraAgendada] = useState("00:00");
  const dataAtual = new Date().toLocaleDateString("pt-BR"); // 🔥 Ex: 29/03/2025



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
  
        // 🔥 Agora busca o próximo sorteio pendente
        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);
  
        let sorteiosPendentes = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(s => s.hora) // só se tiver campo "hora"
          .sort((a, b) => {
            const [h1, m1] = a.hora.split(":").map(Number);
            const [h2, m2] = b.hora.split(":").map(Number);
            return h1 !== h2 ? h1 - h2 : m1 - m2;
          });
  
        if (sorteiosPendentes.length > 0) {
          const maisCedo = sorteiosPendentes[0];
          setHoraAgendada(maisCedo.hora);
          console.log("🕒 Próximo sorteio agendado às:", maisCedo.hora);
        } else {
          console.warn("⚠️ Nenhum sorteio agendado encontrado.");
        }
  
      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
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
  <span className="valor">{dataAtual}</span>
</div>

        <div className="card">
  <h3>HORA</h3>
  <span className="valor">{horaAgendada}</span>
</div>

      </div>
      
    </div>
  );
};

export default CardsSorteio;
