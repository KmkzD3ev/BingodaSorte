import React, { useEffect, useState } from "react";
import "./Vencedores.css"; // 🔥 Arquivo de estilos para customizar a aparência

const Vencedores = ({ vencedores }) => {
  const [visiveis, setVisiveis] = useState([]);

  

  
  useEffect(() => {
    if (!vencedores || vencedores.length === 0) return;

    // 🔒 Mantém apenas o primeiro de cada tipo
  const unicosPorTipo = [];
  const tiposJaAdicionados = new Set();

  for (const v of vencedores) {
    if (!tiposJaAdicionados.has(v.tipo)) {
      unicosPorTipo.push(v);
      tiposJaAdicionados.add(v.tipo);
    }
  }

    // Decide se exibe temporariamente ou não
    const ultimo = unicosPorTipo[unicosPorTipo.length - 1];
    setVisiveis([...unicosPorTipo]);

    if (unicosPorTipo.length < 3) {
      const timer = setTimeout(() => {
        setVisiveis([]);
      }, 4000); // 4 segundos visível

      return () => clearTimeout(timer);
    }
  }, [vencedores]);

  if (visiveis.length === 0) return null;

  return (
    <div className={`vencedores-container ${vencedores.length > 0 ? "show" : "hide"}`}>
      <h2>🏆 Vencedores do Sorteio 🏆</h2>

      {vencedores.length === 0 ? (
        <p className="nenhum-vencedor">Nenhum vencedor ainda...</p>
      ) : (
        <ul className="lista-vencedores">
         {visiveis.map((vencedor, index) => (
            <li key={index} className="vencedor-item">
              🎉 <strong>{vencedor.tipo}</strong> - {vencedor.userName}  
              <span className="cartela-info">(Cartela: {vencedor.cartelaId})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Vencedores;
