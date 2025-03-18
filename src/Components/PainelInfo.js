import React, { useContext, useEffect } from "react";
import "./PainelInfo.css";
import { UserContext } from "../contexts/UserContext"; // 🔹 Importando o Contexto Global
import CartelaBingo from "../Cartelas/CartelaBingo"; // 🔹 Layout das cartelas
import { db, auth } from "../services/firebaseconection"; // 🔹 Firebase Firestore e autenticação
import { collection, query, where, getDocs } from "firebase/firestore"; // 🔹 Métodos do Firestore
import { BingoContext } from "../contexts/BingoContext";

const PainelInfo = ({ mostrarCartelas = true }) => {
  const { saldo, cartelas, setCartelas } = useContext(UserContext);
  const { numerosSorteados } = useContext(BingoContext); // 🔥 Pegando os números sorteados




  useEffect(() => {
    const carregarCartelas = async () => {
      let tentativas = 0;
  
      while (!auth.currentUser && tentativas < 5) {
        console.warn("⏳ [PainelInfo] Esperando auth.currentUser...");
        await new Promise(res => setTimeout(res, 500));
        tentativas++;
      }
  
      const user = auth.currentUser;
      if (!user) {
        console.error("🚨 [PainelInfo] auth.currentUser NÃO foi carregado após 5 tentativas!");
        return;
      }
  
      console.log("✅ [PainelInfo] auth.currentUser carregado:", user.uid);
  
      const cartelasRef = collection(db, "cartelas", user.uid, "userCartelas");
      const q = query(cartelasRef, where("uuid", "==", user.uid));
      const querySnapshot = await getDocs(q);
  
     // console.log("📢 [PainelInfo] Cartelas encontradas:", querySnapshot.size);
      
      let cartelasRecuperadas = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const numeros = Array.isArray(data.casas) && data.casas.length === 25 ? [...data.casas] : new Array(25).fill(0);
        cartelasRecuperadas.push({
          id: doc.id,
          casas: numeros,
          idCartela: data.idNumerico || doc.id || "ID NÃO DEFINIDO",
        });
      });
      
  
      //console.log("✅ [PainelInfo] Cartelas carregadas:", cartelasRecuperadas);
      setCartelas(cartelasRecuperadas);
    };
  
    carregarCartelas();
  }, []);
  
  // 🔥 Loga as cartelas sempre que o estado muda para depuração
  useEffect(() => {
    console.log("🔄 Estado ATUALIZADO de cartelas:", cartelas);
  }, [cartelas]);

  const formatarParaMatriz = (array) => {
    //console.log("📥 Array recebido para formatação:", array);

    if (!Array.isArray(array) || array.length !== 25) {
      console.error("❌ ERRO: Array inválido, retornando matriz vazia", array);
      return [[]]; // Retorna um array vazio para evitar erro
    }

    let matriz = [];
    for (let i = 0; i < 5; i++) {
      matriz.push(array.slice(i * 5, i * 5 + 5));
    }

   // console.log("📋 Matriz formatada corretamente:", matriz);
    return matriz;
  };

  return (
    <div>
      <div className="painel-info">
        <div className="saldo-info">
          <span className="saldo-text">SALDO</span>
          <span className="saldo-valor vermelho">R$ {saldo.toFixed(2).replace(".", ",")}</span>
          <span className="compradas-text">| COMPRADAS</span>
          <span className="compradas-valor vermelho">{cartelas.length}</span>
        </div>
        <div className="icones">
          <button className="btn-icone">🔍</button>
          <button className="btn-icone">⚙️</button>
        </div>
      </div>

      {/* 🔥 Apenas essa parte será removida se mostrarCartelas=false */}
      {mostrarCartelas && (
        <div className="painel-conteudo">
          {console.log("Cartelas carregadas no PainelInfo:", cartelas)}
          
          <div className="cartelas-container">
            {cartelas.length > 0 ? (
              cartelas.map((cartela, index) => {
                console.log(`Cartela ${index} - Números:`, cartela.casas);

                if (!cartela.casas || !Array.isArray(cartela.casas) || cartela.casas.length !== 25) {
                  console.error(`❌ ERRO NA CARTELA ${index}:`, cartela);
                  return <p key={cartela.idCartela}>❌ Erro na cartela {cartela.idCartela}</p>;
                }

                console.log(
                  `📌 Enviando para CartelaBingo (ID: ${cartela.idCartela}):`,
                  formatarParaMatriz(cartela.casas)
                );

                return (
                  <CartelaBingo 
                    key={`cartela-${cartela.idCartela}-${Math.random()}`}  
                    numeros={formatarParaMatriz(cartela.casas)} 
                    idCartela={cartela.idCartela || cartela.idNumerico || "Sem ID"} 
                    numerosSorteados={numerosSorteados} 
                  />
                );
              })
            ) : (
              <p>Aguardando Compra de Cartelas...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelInfo;

