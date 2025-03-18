import React, { useState, useEffect, useContext } from "react";
import api from "../apiServices/api"; // Usa API com autenticação automática
import QRCode from "react-qr-code"; // Biblioteca para gerar QR Code
import { getAuthToken } from "../apiServices/AuthApi"; 
import axios from "axios";
import { db } from "../services/firebaseconection";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
import NavBar from "./NavBar ";
import { UserContext } from "../contexts/UserContext";

const RecargaPix = () => {
  const [valor, setValor] = useState("");
  const [codigoPix, setCodigoPix] = useState("");
  const [status, setStatus] = useState("");
  const [cpf, setCpf] = useState("");
  const { uid } = useContext(UserContext);
  const [loading, setLoading] = useState(true); 
  const [cpfExiste, setCpfExiste] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false); // 🔹 Estado para mostrar o diálogo de carregamento

  useEffect(() => {
    const verificarCpf = async () => {
      if (!uid) return;

      try {
        const userRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().cpf) {
          setCpfExiste(true);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar CPF:", error);
      } finally {
        setLoading(false);
      }
    };

    verificarCpf();
  }, [uid]);

  const salvarCpf = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setStatus("❌ Erro: Faça login antes de continuar.");
        return;
      }

      if (!cpf || cpf.length !== 11) {
        return;
      }

      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, { cpf });

      setCpfExiste(true);
      setStatus("✅ CPF atualizado com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao atualizar CPF no Firestore:", error);
      setStatus("❌ Erro ao atualizar CPF.");
    }
  };

  const gerarQrCode = async () => {
    if (!valor || isNaN(valor) || parseFloat(valor) < 2) {
      setStatus("⚠️ O valor mínimo para recarga é R$2,00.");
      return;
    }
    const valorEmCentavos = parseInt(valor) * 100;

    if (valorEmCentavos < 200) {
      setStatus("⚠️ O valor mínimo para recarga é R$2,00.");
      return;
    }

    try {
      setLoadingQr(true); // 🔹 Exibe o diálogo de carregamento

      const token = await getAuthToken();
      const userRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setStatus("❌ Erro: Usuário não encontrado.");
        setLoadingQr(false);
        return;
      }

      const userData = userSnap.data();
      const nomeUsuario = userData.nome || "Usuário Desconhecido"; // 🔥 Obtém nome do Firebase
      const cpfUsuario = userData.cpf || ""; // 🔥 Obtém CPF do Firebase

      if (!cpfUsuario) {
        setStatus("❌ Erro: CPF não cadastrado. Atualize seu perfil.");
        setLoadingQr(false);
        return;
      }

      const requestData = {
        value_cents: valorEmCentavos,
        generator_name: nomeUsuario,  // 🔥 Agora enviando nome real do usuário
        generator_document: cpfUsuario,  // 🔥 Agora enviando CPF real do usuário
        expiration_time: 1800,
        external_reference: `Recarga-${Date.now()}`
      };

      const requestHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post("https://backend-proxy-6x3n.onrender.com/proxy/qrcode", requestData, { headers: requestHeaders });

      const qrData = response.data.qrcode;
      setCodigoPix(qrData.content);
      setStatus("✅ QR Code gerado! Efetue o pagamento.");

      verificarPagamentoAutomatico(requestData.external_reference);

      console.log("🔹 Dados enviados para gerar QR Code:", {
        valor: requestData.valor,
        nomeUsuario,
        cpfUsuario,
        external_reference: requestData.external_reference,
        expiration_time: requestData.expiration_time,
        token: token
      });
      
      
    } catch (error) {
      console.error("❌ Erro ao gerar QR Code:", error);
      setStatus("❌ Erro ao gerar QR Code.");
    } finally {
      setLoadingQr(false); // 🔹 Esconde o diálogo quando terminar
    }
};


// 🔥 Verificar pagamento automaticamente (Polling)
const verificarPagamentoAutomatico = async (referenceCode) => {
  let tentativas = 0; // Número de tentativas de verificação
  const maxTentativas = 10; // Limite de tentativas (exemplo: 10 verificações)

  const interval = setInterval(async () => {
    try {
      // 🔍 Faz a requisição para consultar o pagamento
      const response = await axios.get(`https://backend-proxy-6x3n.onrender.com/webhook/pagamento/${referenceCode}`);

      // ✅ Se o pagamento for confirmado, para a verificação
      if (response.data.status === "paid") {
        setStatus("✅ Pagamento confirmado!");
        clearInterval(interval); // Para a verificação automática
      } else {
        setStatus(`⌛ Aguardando pagamento... Tentativa ${tentativas + 1}/${maxTentativas}`);
      }

      // 📌 Se atingirmos o limite de tentativas, paramos a verificação
      if (++tentativas >= maxTentativas) {
        clearInterval(interval);
        setStatus("⚠️ Tempo limite atingido. Verifique manualmente mais tarde.");
      }
    } catch (error) {
      console.error("❌ Erro ao verificar pagamento:", error);
      setStatus("❌ Erro ao verificar pagamento.");
      clearInterval(interval); // Se der erro, para de tentar
    }
  }, 5000); // 🔄 Verifica a cada 5 segundos
};


  const styles = `
  .spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    z-index: 2000;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #3498db;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .codigo-pix {
  word-wrap: break-word; /* 🔹 Permite que o texto quebre linha */
  overflow-wrap: break-word; /* 🔹 Quebra de palavra automática */
  display: block; /* 🔹 Faz o texto ocupar toda a largura disponível */
  max-width: 100%; /* 🔹 Garante que o texto não ultrapasse os limites */
  text-align: center; /* 🔹 Centraliza o código Pix */
  font-size: 14px; /* 🔹 Ajusta o tamanho para melhor leitura */
}
`;
  return (
    
    <div>
       <style>{styles}</style>
      {/* 🔹 NavBar Fixo no Topo */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000 }}>
        <NavBar />
      </div>

      {/* 🔹 Overlay de Carregamento */}
      {loadingQr && (
         <div className="spinner-container">
          <div className="spinner"></div>
            <p>Gerando QR Code...</p>
         </div>
      )}

      <div className="recarga-container" style={{ paddingTop: "60px" }}>
        <h2>Recarga via Pix</h2>

        {!cpfExiste && !loading && (
          <div className="input-group">
            <input
              type="text"
              placeholder="Insira CPF para resgatar o bônus!"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
            <button onClick={salvarCpf}>Salvar CPF</button>
          </div>
        )}

<div className="input-group">
  <input
    type="number"
    placeholder="Valor da recarga (mínimo R$2,00)"
    value={valor}
    onChange={(e) => {
      let inputValue = e.target.value;

      if (inputValue === "") {
        setValor(""); // Permite que o usuário apague o campo
        return;
      }

      const parsedValue = parseFloat(inputValue);
      if (!isNaN(parsedValue)) {
        setValor(parsedValue);
      }
    }}
    min="2"
  />
</div>


        <button onClick={gerarQrCode} disabled={loadingQr}>Gerar QR Code</button>

        {codigoPix && (
          <div className="qrcode-section">
            <h3>Escaneie o QR Code para pagar:</h3>
            <QRCode value={codigoPix} size={200} />
            <p>
              <strong>Código Pix:</strong>
              <br />
              <span className="codigo-pix">{codigoPix}</span>
            </p>
            <button onClick={() => navigator.clipboard.writeText(codigoPix)}>
              📋 Copiar Código Pix
            </button>
          </div>
        )}

        {status && <p className="status-msg">{status}</p>}
      </div>
    </div>
  );
};

export default RecargaPix;
