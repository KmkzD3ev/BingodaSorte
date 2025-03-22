import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { db, auth } from "../services/firebaseconection";
import { doc, updateDoc, collection, addDoc, getDocs } from "firebase/firestore";
import useCartela from "../Cadastro/useCartelas/useCartela.js";

const CartelaCompraModal = ({ sorteioId, onClose }) => {
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
    };

    buscarSorteios();
  }, []);

  useEffect(() => {
    if (sorteioId) {
      setSorteioSelecionado(sorteioId);
    }
  }, [sorteioId]);

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

  const finalizarCompra = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const custoTotal = quantidade * precoCartela;
        const userRef = doc(db, "usuarios", user.uid);

        await updateDoc(userRef, { saldo: saldo - custoTotal });
        setSaldo(saldo - custoTotal);

        for (let i = 0; i < quantidade; i++) {
          const novaCartela = {
            uuid: user.uid,
            idNumerico: gerarIdUnico(),
            casas: gerarNumerosAleatorios(),
            dataCriacao: new Date().toISOString(),
            idSorteioAgendado: sorteioSelecionado,
          };
          await addCartela(novaCartela);
        }

        const hora = sorteiosDisponiveis.find(s => s.id === sorteioSelecionado)?.hora;
        alert(`Compra de ${quantidade} cartela(s) para o sorteio das ${hora} realizada com sucesso!`);

        setQuantidade(0);
        if (onClose) onClose();
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

    setMostrarSeletor(true);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "20px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "18px",
          background: "transparent",
          border: "none",
          cursor: "pointer"
        }}>
          ✖️
        </button>

        {/* Cartela Compra Interface */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {[1, 5, 10, 20, 40, 50, 100].map((num) => (
              <button key={num} onClick={() => selecionarQuantidade(num)} style={{
                background: "yellow",
                border: "1px solid #000",
                padding: "5px 10px",
                fontSize: "16px",
                borderRadius: "20px",
                cursor: "pointer"
              }}>{num}</button>
            ))}
          </div>

          <div style={{
            display: "flex",
            background: "#0b3d91",
            borderRadius: "50px",
            padding: "5px 15px",
            gap: "10px",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <button onClick={() => alterarQuantidade(-1)} style={{
              background: "transparent",
              color: "yellow",
              border: "none",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer"
            }}>-</button>
            <span style={{ fontSize: "18px", color: "white", fontWeight: "bold" }}>{quantidade}</span>
            <button onClick={() => alterarQuantidade(1)} style={{
              background: "transparent",
              color: "yellow",
              border: "none",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer"
            }}>+</button>
            <span style={{ fontSize: "18px", color: "white", fontWeight: "bold" }}>R$ {totalCompra}</span>
          </div>

          <button onClick={comprarCartelas} style={{
            background: "green",
            color: "white",
            border: "none",
            padding: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            borderRadius: "50px",
            width: "100%",
            marginTop: "10px"
          }}>COMPRAR</button>

          {mostrarSeletor && sorteiosDisponiveis.length > 0 && (
            <div style={{
              marginTop: "15px",
              background: "#fff",
              padding: "15px",
              borderRadius: "12px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)"
            }}>
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
                    setTimeout(() => finalizarCompra(), 100);
                  }
                }}
                style={{
                  padding: "6px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginTop: "4px",
                  width: "100%",
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
      </div>
    </div>
  );
};

export default CartelaCompraModal;
