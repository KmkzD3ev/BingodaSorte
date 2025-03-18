import React, { useState, useEffect } from "react";
import { db } from "../services/firebaseconection";
import { doc, getDoc } from "firebase/firestore";
import "./SorteioPainel.css";

const SorteioPainel = () => {
  const [sorteioData, setSorteioData] = useState(null);
  const [tempoRestante, setTempoRestante] = useState({ horas: "00", minutos: "00" });

  useEffect(() => {
    const buscarDadosSorteio = async () => {
      try {
        const docRef = doc(db, "config", "dadosSorteio");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSorteioData(data);

          localStorage.setItem("sorteioData", JSON.stringify(data));
          console.log("✅ Dados do sorteio salvos no localStorage:", data);



          iniciarContagemRegressiva(data.tempoMinutos);
        } else {
          console.log("❌ Nenhum dado encontrado no Firestore.");
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do sorteio:", error);
      }
    };

    buscarDadosSorteio();
  }, []);

  const iniciarContagemRegressiva = (tempoMinutos) => {
    const fimDoSorteio = new Date();
    fimDoSorteio.setMinutes(fimDoSorteio.getMinutes() + tempoMinutos);

    const atualizarTempo = () => {
      const agora = new Date();
      const diferenca = fimDoSorteio - agora;

      if (diferenca <= 0) {
        setTempoRestante({ horas: "00", minutos: "00" });
        return;
      }

      const horas = String(Math.floor(diferenca / (1000 * 60 * 60))).padStart(2, "0");
      const minutos = String(Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");

      setTempoRestante({ horas, minutos });
    };

    atualizarTempo();
    const intervalo = setInterval(atualizarTempo, 1000);
    return () => clearInterval(intervalo);
  };

  if (!sorteioData) {
    return <p>🔄 Carregando dados do sorteio...</p>;
  }

  return (
    <div className="painel-container">
      {/* Relógio */}
      <div className="relogio">
        <span className="numero">{tempoRestante.horas[0]}</span>
        <span className="numero">{tempoRestante.horas[1]}</span>
        <span className="dois-pontos">:</span>
        <span className="numero">{tempoRestante.minutos[0]}</span>
        <span className="numero">{tempoRestante.minutos[1]}</span>
      </div>

      {/* Informações abaixo do relógio */}
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
          <span className="destaque"> 23:30</span>
        </div>
      </div>

      {/* Lista de prêmios */}
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
