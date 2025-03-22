import React, { useState, useEffect } from "react";
import { db } from "../services/firebaseconection";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import "./SorteioPainel.css";

const SorteioPainel = () => {
  const [sorteioData, setSorteioData] = useState(null);
  const [tempoRestante, setTempoRestante] = useState({ horas: "00", minutos: "00" });
  const [horaAgendada, setHoraAgendada] = useState("00:00");

  useEffect(() => {
    const buscarDados = async () => {
      try {
        // 1. Dados dos prêmios
        const configRef = doc(db, "config", "dadosSorteio");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const dados = configSnap.data();
          setSorteioData(dados);
          console.log("✅ Dados do sorteio carregados:", dados);
        }

        // 2. Horário do próximo sorteio
        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);

        let horario = null;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.hora) {
            horario = data.hora;
            console.log("🎯 Horário do sorteio encontrado:", horario);
          }
        });

        if (horario) {
          setHoraAgendada(horario);
          iniciarContagemRegressiva(horario);
        } else {
          console.warn("⚠️ Nenhum horário pendente encontrado.");
        }

      } catch (e) {
        console.error("❌ Erro ao buscar dados:", e);
      }
    };

    buscarDados();
  }, []);
  const iniciarContagemRegressiva = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    const agora = new Date();
    const sorteioDate = new Date();
  
    // Setando hora do sorteio
    sorteioDate.setHours(h, m, 0, 0);
  
    // 🔥 Se a hora do sorteio for anterior ao agora, significa que é no próximo dia
    if (sorteioDate <= agora) {
      sorteioDate.setDate(sorteioDate.getDate() + 1);
      console.log("📆 Ajustando para o dia seguinte:", sorteioDate.toLocaleString());
    }
  
    console.log("🕒 Agora:", agora.toLocaleTimeString());
    console.log("🕕 Horário do sorteio:", sorteioDate.toLocaleTimeString());
  
    const atualizar = () => {
      const agora = new Date();
      const diff = sorteioDate - agora;
  
      if (diff <= 0) {
        setTempoRestante({ horas: "00", minutos: "00" });
        return;
      }
  
      const horas = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const minutos = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
  
      setTempoRestante({ horas, minutos });
    };
  
    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  };
  

  if (!sorteioData) {
    return <p>🔄 Carregando dados do sorteio...</p>;
  }

  return (
    <div className="painel-container">
      {/* Contador */}
      <div className="relogio">
        <span className="numero">{tempoRestante.horas[0]}</span>
        <span className="numero">{tempoRestante.horas[1]}</span>
        <span className="dois-pontos">:</span>
        <span className="numero">{tempoRestante.minutos[0]}</span>
        <span className="numero">{tempoRestante.minutos[1]}</span>
      </div>

      {/* Informações gerais */}
      <div className="info-container">
        <div className="info">
          <p>SORTEIO</p>
          <span className="destaque vermelho">052585</span>
        </div>
        <div className="linha"></div>
        <div className="info">
          <p>DOAÇÃO</p>
          <span className="destaque">R$ 0,15</span>
        </div>
        <div className="linha"></div>
        <div className="info">
          <p>HORA</p>
          <span className="destaque">{horaAgendada}</span>
        </div>
      </div>

      {/* Prêmios */}
      <div className="premios">
        <div className="premio-item">
          <span className="premio-texto">🏆 1º PRÊMIO</span>
          <span className="valor">R$ {sorteioData.primeiro},00</span>
        </div>
        <div className="premio-item">
          <span className="premio-texto">🥈 2º PRÊMIO</span>
          <span className="valor">R$ {sorteioData.segundo},00</span>
        </div>
        <div className="premio-item">
          <span className="premio-texto">🏆 3º PRÊMIO</span>
          <span className="valor">R$ {sorteioData.terceiro},00</span>
        </div>
      </div>

      {/* Acumulado */}
      <div className="acumulado">
        <span className="acumulado-texto">ACUMULADO</span>
        <span className="estrela">⭐ {sorteioData.quantidadeAcumulado}</span>
        <span className="valor">R$ {sorteioData.acumulado},00</span>
      </div>
    </div>
  );
};

export default SorteioPainel;
