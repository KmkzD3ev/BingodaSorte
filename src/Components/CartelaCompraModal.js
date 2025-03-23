import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { db, auth } from "../services/firebaseconection";
import { doc, updateDoc } from "firebase/firestore";
import useCartela from "../Cadastro/useCartelas/useCartela.js";

const CartelaCompraModal = ({ sorteioId, onClose }) => {
  const { saldo, setSaldo } = useContext(UserContext);
  const precoCartela = 0.50;
  const { addCartela } = useCartela();

  const [quantidade, setQuantidade] = useState(0);
  const [comprando, setComprando] = useState(false);

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
    if (comprando || quantidade === 0) return;
    const custoTotal = quantidade * precoCartela;

    if (saldo < custoTotal) {
      alert("Saldo insuficiente!");
      return;
    }

    setComprando(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, { saldo: saldo - custoTotal });
      setSaldo(saldo - custoTotal);

      for (let i = 0; i < quantidade; i++) {
        const novaCartela = {
          uuid: user.uid,
          idNumerico: gerarIdUnico(),
          casas: gerarNumerosAleatorios(),
          dataCriacao: new Date().toISOString(),
          idSorteioAgendado: sorteioId,
        };
        await addCartela(novaCartela);
      }

      alert(`Compra de ${quantidade} cartela(s) realizada com sucesso!`);
      setQuantidade(0);
      onClose?.();
    } catch (error) {
      console.error("Erro ao comprar cartelas:", error);
      alert("Erro ao processar a compra.");
    } finally {
      setComprando(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 9999, padding: "20px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "20px",
        width: "100%", maxWidth: "500px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
        position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "10px", right: "10px",
          fontSize: "18px", background: "transparent", border: "none", cursor: "pointer"
        }}>✖️</button>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{
            display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center"
          }}>
            {[1, 5, 10, 20, 40, 50, 100].map((num) => (
              <button key={num} onClick={() => selecionarQuantidade(num)} style={{
                background: "yellow", border: "1px solid #000",
                padding: "5px 10px", fontSize: "16px", borderRadius: "20px", cursor: "pointer"
              }}>{num}</button>
            ))}
          </div>

          <div style={{
            display: "flex", background: "#0b3d91", borderRadius: "50px",
            padding: "5px 15px", gap: "10px", justifyContent: "center", alignItems: "center"
          }}>
            <button onClick={() => alterarQuantidade(-1)} style={{
              background: "transparent", color: "yellow", border: "none",
              fontSize: "18px", fontWeight: "bold", cursor: "pointer"
            }}>-</button>
            <span style={{ fontSize: "18px", color: "white", fontWeight: "bold" }}>{quantidade}</span>
            <button onClick={() => alterarQuantidade(1)} style={{
              background: "transparent", color: "yellow", border: "none",
              fontSize: "18px", fontWeight: "bold", cursor: "pointer"
            }}>+</button>
            <span style={{ fontSize: "18px", color: "white", fontWeight: "bold" }}>R$ {totalCompra}</span>
          </div>

          <button
            onClick={finalizarCompra}
            disabled={comprando}
            style={{
              background: "green", color: "white", border: "none", padding: "15px",
              fontSize: "18px", fontWeight: "bold", cursor: "pointer", borderRadius: "50px",
              width: "100%", marginTop: "10px", opacity: comprando ? 0.6 : 1
            }}
          >
            {comprando ? "Processando..." : "COMPRAR"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartelaCompraModal;
