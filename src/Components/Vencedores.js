import React from "react";
import "./Vencedores.css"; // 🔥 Arquivo de estilos para customizar a aparência

const Vencedores = ({ vencedores }) => {
  return (
    <div className={`vencedores-container ${vencedores.length > 0 ? "show" : "hide"}`}>
      <h2>🏆 Vencedores do Sorteio 🏆</h2>

      {vencedores.length === 0 ? (
        <p className="nenhum-vencedor">Nenhum vencedor ainda...</p>
      ) : (
        <ul className="lista-vencedores">
          {vencedores.map((vencedor, index) => (
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
