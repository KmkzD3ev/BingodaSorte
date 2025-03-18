import React, { useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { UserContext } from "../contexts/UserContext"; // 🔹 Obtendo o contexto global do usuário
import CartelaBingo from "./CartelaBingo";

const GeradorCartelas = () => {
  const { user } = useContext(UserContext); // 🔹 Obtendo o nome do usuário do contexto
  const [cartelas, setCartelas] = useState([]);
  const [nomeBingo, setNomeBingo] = useState("Bingo React");

  const getRandomNumbers = () => {
    const numeros = Array.from({ length: 90 }, (_, i) => i + 1);
    const selecionados = [];

    while (selecionados.length < 25) {
      const index = Math.floor(Math.random() * numeros.length);
      selecionados.push(numeros.splice(index, 1)[0]);
    }
    return selecionados;
  };

  const gerarCartela = () => {
    const idNumericoAleatorio = Math.floor(1000 + Math.random() * 9000); // ID aleatório de 4 dígitos
    return new Cartela(uuidv4(), idNumericoAleatorio, nomeBingo, getRandomNumbers(), user);
    
  };

  const handleGerarCartelas = (quantidade) => {
    let novasCartelas = [];
    for (let i = 0; i < quantidade; i++) {
      const novaCartela = gerarCartela();
      if (novaCartela) {
        novasCartelas.push(novaCartela);
      }
    }
    setCartelas([...cartelas, ...novasCartelas]);
  };

  // 🔹 Gera uma cartela automaticamente ao carregar a página
  useEffect(() => {
    handleGerarCartelas(1); // 🔥 Gera uma cartela assim que o componente for montado
  }, []);

  return (
    <div>
      <h2>Gerador de Cartela</h2>
      <div className="cartelas-container">
        {cartelas.map((cartela) => {
          // 🔹 Logando os dados antes de enviar para CartelaBingo
          console.log("📜 Enviando para CartelaBingo:", {
            uuid: cartela.uuid,
            idCartela: cartela.idNumerico,
            numeros: cartela.casas,
          });

          return (
            <CartelaBingo
              key={cartela.uuid}
              numeros={cartela.casas ?? [[]]} // ✅ Garante que sempre seja um array
              idCartela={cartela.idNumerico}
            />
          );
        })}
      </div>
    </div>
  );
};

const CartelaComponent = ({ cartela }) => {
  useEffect(() => {
    console.log(`📢 Cartela Gerada (ID: ${cartela.idNumerico}) - Usuário: ${cartela.user}`);
    console.table(cartela.casas);
  }, [cartela]);

  return (
    <div className="cartela">
      <h2 className="cartela-titulo">{cartela.idNumerico} - {cartela.titulo} (Usuário: {cartela.user})</h2>
      <div className="cartela-corpo">
        {cartela.casas.map((linha, i) => (
          <div key={i} className="cartela-linha" style={{ display: 'flex', gap: '5px' }}>
            {linha.map((casa, j) => (
              <div key={j} className="cartela-casa" style={{ padding: '10px', border: '1px solid black' }}>{casa}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

class Cartela {
  constructor(uuid, idNumerico, titulo, casas, user) {
    this.uuid = uuid;
    this.idNumerico = idNumerico;
    this.titulo = titulo;
    this.user = user;
    this.casas = [];
    
    for (let i = 0; i < 5; i++) {
      this.casas.push(casas.slice(i * 5, i * 5 + 5));
    }
  }
}

export default GeradorCartelas;


