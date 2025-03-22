import React, { useState, useContext, useEffect } from "react";
import "./CartelaCompra.css";
import { UserContext } from "../contexts/UserContext";
import { db, auth } from "../services/firebaseconection";
import { doc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import useCartela from "../Cadastro/useCartelas/useCartela.js";

const CartelaCompra = ({ sorteioId }) => {
  const { saldo, setSaldo } = useContext(UserContext);
  const [quantidade, setQuantidade] = useState(0);
  const precoCartela = 0.50;
  const { addCartela } = useCartela();

  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const [sorteioSelecionado, setSorteioSelecionado] = useState("");
  const [sorteiosDisponiveis, setSorteiosDisponiveis] = useState([]);


  useEffect(() => {
    const buscarSorteios = async () => {
      const ref = collection(db, "sorteios_agendados");
      const snapshot = await getDocs(ref);
      const pendentes = snapshot.docs
        .filter(doc => doc.data().status === "pendente")
        .map(doc => ({ id: doc.id, hora: doc.data().hora }));
  
      setSorteiosDisponiveis(pendentes);
      // ❌ NÃO definir setSorteioSelecionado aqui
    };
  
    buscarSorteios();
  }, []);
  
  const alterarQuantidade = (valor) => {
    if (quantidade + valor >= 0) setQuantidade(quantidade + valor);
  };

  const selecionarQuantidade = (valor) => setQuantidade(valor);

  const totalCompra = (quantidade * precoCartela).toFixed(2).replace(".", ",");

  const gerarIdUnico = () => Math.floor(10000 + Math.random() * 90000).toString();

  const gerarNumerosAleatorios = () => {
    let numeros = Array.from({ length: 90 }, (_, i) => i + 1);
    let selecionados = [];
    while (selecionados.length < 25) {
      const index = Math.floor(Math.random() * numeros.length);
      selecionados.push(numeros.splice(index, 1)[0]);
    }
    return selecionados;
  };

  const finalizarCompra = async (idSelecionado) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        const custoTotal = quantidade * precoCartela;
  
        await updateDoc(userRef, { saldo: saldo - custoTotal });
        setSaldo(saldo - custoTotal);
  
        for (let i = 0; i < quantidade; i++) {
          const novaCartela = {
            uuid: user.uid,
            idNumerico: gerarIdUnico(),
            casas: gerarNumerosAleatorios(),
            dataCriacao: new Date().toISOString(),
            idSorteioAgendado: idSelecionado,
          };
          await addCartela(novaCartela);
        }
  
        const hora = sorteiosDisponiveis.find(s => s.id === idSelecionado)?.hora;
  
        alert(`Compra de ${quantidade} cartela(s) para o sorteio das ${hora} realizada com sucesso!`);
        setQuantidade(0);
      }
    } catch (error) {
      console.error("Erro ao comprar cartelas:", error);
      alert("Erro ao processar a compra.");
    }
  };
  

  const comprarCartelas = () => {
    if (quantidade === 0) {
      alert("Selecione pelo menos 1 cartela!");
      return;
    }

    const custoTotal = quantidade * precoCartela;

    if (saldo < custoTotal) {
      alert("Saldo insuficiente!");
      return;
    }

    // Agora, mostramos o seletor de horário antes de finalizar
    setMostrarSeletor(true);
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

      {mostrarSeletor && sorteiosDisponiveis.length > 0 && (
        <div className="seletor-sorteio-popup">
          <label htmlFor="sorteioSelecionado" style={{ fontWeight: "bold" }}>
            Escolha o sorteio:
          </label>
          <select
  id="sorteioSelecionado"
  value={sorteioSelecionado}
  onChange={(e) => {
    const novoValor = e.target.value;
    if (novoValor !== "") {
      setSorteioSelecionado(novoValor);
      setMostrarSeletor(false);
      setTimeout(() => {
        finalizarCompra(novoValor);
      }, 100);
    }
  }}
  style={{
    padding: "6px",
    borderRadius: "8px",
    fontSize: "14px",
    marginTop: "4px",
    width: "100%"
  }}
>
  <option value="">Selecione o horário</option>
  {sorteiosDisponiveis.map((sorteio) => (
    <option key={sorteio.id} value={sorteio.id}>
      {sorteio.hora}
    </option>
  ))}
</select>


        
        </div>
      )}
    </div>
  );
};

export default CartelaCompra;
