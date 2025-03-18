import React, { useEffect, useState } from "react";
import "./CartelasFaltantes.css"; // 🔥 Importa o CSS

const CartelasFaltantes = ({ cartelas, numerosSorteados }) => {
  const [cartelaAtual, setCartelaAtual] = useState(null);

  useEffect(() => {
    if (!cartelas || cartelas.length === 0) return;

    // 🔥 Pega a cartela com menos números faltando
    const cartelaSelecionada = cartelas
      .map(cartela => ({
        ...cartela,
        numerosFaltando: cartela.casas.filter(num => !numerosSorteados.includes(num))
      }))
      .sort((a, b) => a.numerosFaltando.length - b.numerosFaltando.length)[0]; // 🔥 Ordena para pegar a cartela com MENOS números faltantes

    setCartelaAtual(cartelaSelecionada); // 🔄 Atualiza o estado com a nova cartela
  }, [cartelas, numerosSorteados]); // 🔥 Atualiza sempre que os números sorteados mudam

  return (
    <div className="cartelas-faltantes-container">
      {cartelaAtual ? (
        <>
          <div className="cartela-header">
            {cartelaAtual.idNumerico} - {cartelaAtual.userName}
          </div>

          <div className="cartela-grid">
            {cartelaAtual.numerosFaltando.slice(0, 5).map((num, i) => (
              <div key={i} className={`cartela-numero ${numerosSorteados.includes(num) ? "marcado" : ""}`}>
                {num.toString().padStart(2, "0")}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>⚠️ Nenhuma cartela disponível</div>
      )}
    </div>
  );
};

export default CartelasFaltantes;
