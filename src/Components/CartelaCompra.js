import React, { useState, useContext } from "react";
import "./CartelaCompra.css";
import { UserContext } from "../contexts/UserContext"; // 🔹 Pegando o contexto global
import { db, auth } from "../services/firebaseconection";
import { doc, updateDoc } from "firebase/firestore"; // 🔹 Mantemos Firestore APENAS para atualizar saldo
import CartelaBingo from "../Cartelas/CartelaBingo"; // 🔹 Agora chamamos CartelaBingo
import { v4 as uuidv4 } from "uuid"; // 🔹 Geração de UUID
import { collection, addDoc } from "firebase/firestore";
import useCartela from "../Cadastro/useCartelas/useCartela.js";



const CartelaCompra = () => {
  const { saldo, setSaldo, cartelas, setCartelas } = useContext(UserContext);
  const [quantidade, setQuantidade] = useState(0);
  const precoCartela = 0.50;
  const { addCartela } = useCartela();

  const alterarQuantidade = (valor) => {
    if (quantidade + valor >= 0) {
      setQuantidade(quantidade + valor);
    }
  };

  const selecionarQuantidade = (valor) => {
    setQuantidade(valor);
  };

  const totalCompra = (quantidade * precoCartela).toFixed(2).replace(".", ",");

  const gerarIdUnico = () => Math.floor(10000 + Math.random() * 90000).toString();
  const gerarNumerosAleatorios = () => {
    let numeros = Array.from({ length: 90 }, (_, i) => i + 1);
    let selecionados = [];
  
    while (selecionados.length < 25) {
      const index = Math.floor(Math.random() * numeros.length);
      selecionados.push(numeros.splice(index, 1)[0]);
    }
  
    return selecionados; // 🔹 Agora retorna um array simples, compatível com Firestore
  };

  

  
  const comprarCartelas = async () => {
    if (quantidade === 0) {
      alert("Selecione pelo menos 1 cartela!");
      return;
    }

    const custoTotal = quantidade * precoCartela;

    if (saldo < custoTotal) {
      alert("Saldo insuficiente!");
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);

        // 🔹 Atualiza o saldo no Firestore
        await updateDoc(userRef, {
          saldo: saldo - custoTotal,
        });

        setSaldo(saldo - custoTotal); // 🔹 Atualiza o saldo no estado local

       
        let novasCartelas = []; 

        for (let i = 0; i < quantidade; i++) {
          const novaCartela = {
            uuid: user.uid, 
            idNumerico: gerarIdUnico(),
            casas: gerarNumerosAleatorios(),
            dataCriacao: new Date().toISOString(),
          };
  
          await addCartela(novaCartela); // 🔹 Salva a cartela no Firestore
          novasCartelas.push(novaCartela);
  
          
        }
    
        alert(`Compra de ${quantidade} cartelas realizada com sucesso!`);
        setQuantidade(0);
      }
    } catch (error) {
      console.error("Erro ao comprar cartelas:", error);
      alert("Erro ao processar a compra.");
    }
  };

  const formatarParaMatriz = (array) => {
    let matriz = [];
    for (let i = 0; i < 5; i++) {
      matriz.push(array.slice(i * 5, i * 5 + 5));
    }
    return matriz;
  };

  return (
    <div className="cartela-compra">
      <div className="opcoes-cartelas">
        {[1, 5, 10, 20, 40, 50, 100].map((num) => (
          <button key={num} onClick={() => selecionarQuantidade(num)}>{num}</button>
        ))}
      </div>

      <div className="seletor-manual">
        <button onClick={() => alterarQuantidade(-1)}>-</button>
        <span>{quantidade}</span>
        <button onClick={() => alterarQuantidade(1)}>+</button>
        <span>R$ {totalCompra}</span>
      </div>

      <button className="botao-comprar" onClick={comprarCartelas}>
        COMPRAR
      </button>
      

     
    </div>
  );
};

export default CartelaCompra;
