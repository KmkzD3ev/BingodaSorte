import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebaseconection";
import { doc, getDoc,updateDoc } from "firebase/firestore";
import NavBar from "../Components/NavBar ";
import { getAuthToken } from "../apiServices/AuthApi"; 
import axios from "axios";

// https://backend-proxy-6x3n.onrender.com/proxy/pagamento
/***
 * URL PARA SOLICITAR PAGMENTO
 * 
 */
const MeusPremios = () => {
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarPremios = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          console.log("⚠️ Nenhum usuário autenticado.");
          setLoading(false);
          return;
        }

        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log("⚠️ Usuário não encontrado no Firestore.");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const premiosUsuario = userData.premios || [];

        setPremios(premiosUsuario);
      } catch (error) {
        console.error("🔥 Erro ao buscar prêmios do usuário:", error);
      }
      setLoading(false);
    };

    buscarPremios();
  }, []);
  const handleSacar = async (premio) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log("⚠️ Nenhum usuário autenticado.");
            return;
        }

        // 🔥 Obtendo dados do usuário do Firestore
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.log("❌ Usuário não encontrado no Firestore.");
            return;
        }

        const userData = userSnap.data();
        const chavePix = userData.chavePix;
        const cpf = userData.cpf;
        const nome = userData.nome;

        if (!chavePix || !nome) {
            console.log("❌ Dados do usuário incompletos para saque.");
            return;
        }

        // 🔥 Detectar automaticamente o tipo de chave Pix
        let pixKeyType;
        if (chavePix.includes("@")) {
            pixKeyType = "email";
        } else if (chavePix.match(/^\d{11}$/) && chavePix.startsWith("0") === false) {
            pixKeyType = "cpf";
        } else if (chavePix.match(/^\d{14}$/)) {
            pixKeyType = "cnpj";
        } else if (chavePix.match(/^\d{10,11}$/)) {
            pixKeyType = "phone";
        } else {
            pixKeyType = "token";
        }

        // 🔥 Criando requisição de pagamento Pix
        const requestData = {
            initiation_type: "dict",
            idempotent_id: `SAQUE_${Date.now()}`,
            receiver_name: nome,
            value_cents: premio.valorPremio * 100, // Convertendo para centavos
            pix_key_type: pixKeyType,
            pix_key: chavePix,
            authorized: false 
            //FALTA DE AUTORIZAÇAO
        };

        // 🔥 Se a chave for CPF ou CNPJ, adicionamos receiver_document
        if (pixKeyType === "cpf" || pixKeyType === "cnpj") {
            requestData.receiver_document = cpf;
        }

        console.log("📌 Enviando solicitação de saque:", JSON.stringify(requestData, null, 2));

        const token = await getAuthToken();
        console.log("🔑 Token de autenticação:", token);

        const requestHeaders = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        console.log("📌 Headers da requisição:", requestHeaders);

        // 🔥 Fazendo a requisição para a API de pagamentos
        const response = await axios.post(
            "https://backend-proxy-6x3n.onrender.com/proxy/pagamento",
            requestData,
            { headers: requestHeaders }
        );

        console.log("🔹 Resposta completa da API:", response.data);

        // 🔥 Captura o `reference_code` para rastreamento
        const referenceCode = response.data.payment?.reference_code;

        console.log("🔹 reference_code recebido do servidor:", referenceCode);

        if (!referenceCode) {
            console.error("❌ Erro: reference_code não retornado pela API.");
            alert("❌ Erro ao solicitar saque: reference_code não foi retornado.");
            return;
        }

        alert("✅ Solicitação de saque enviada! Monitorando pagamento...");

        // 🔥 Agora chama a função que verifica se o pagamento foi concluído
        verificarPagamentoSaque(referenceCode);

    } catch (error) {
        console.error("❌ Erro ao solicitar saque:", error);

        // 🔥 Tratamento de erros específicos da API
        if (error.response) {
            console.log("🔴 Resposta de erro da API:", error.response.data);
            if (error.response.status === 400) {
                alert(`❌ Erro 400: ${error.response.data.error || "Requisição inválida."}`);
            } else if (error.response.status === 422) {
                alert(`❌ Erro 422: ${error.response.data.error || "Fundos insuficientes."}`);
            } else if (error.response.status === 403) {
                alert(`❌ Erro 403: ${error.response.data.error || "Beneficiário não permitido."}`);
            } else if (error.response.status === 500) {
                alert(`❌ Erro 500: ${error.response.data.error || "Falha na operação. Tente novamente."}`);
            } else {
                alert(`❌ Erro inesperado (${error.response.status}): ${error.response.data.error}`);
            }
        } else {
            alert("❌ Erro desconhecido. Verifique o console.");
        }
    }
};


const verificarPagamentoSaque = async (referenceCode) => {
    let tentativas = 0;
    const maxTentativas = 10; // 🔥 Define quantas vezes vai tentar verificar o pagamento
    const intervalo = 30000; // 🔥 30 segundos entre cada tentativa

    const interval = setInterval(async () => {
        try {
            console.log(`🔍 Verificando status do pagamento para reference_code: ${referenceCode} (Tentativa ${tentativas + 1}/${maxTentativas})`);

            // 🔥 Faz a requisição ao backend para verificar o status
            const response = await axios.get(`https://backend-proxy-6x3n.onrender.com/webhook/pagamento/${referenceCode}`);

            console.log("🔹 Resposta da verificação:", response.data);

            // 🔥 Verifica se o pagamento foi concluído
            if (response.data.status === "completed") {
                console.log("✅ Pagamento confirmado!");
                alert("✅ Seu saque foi processado com sucesso!");
                clearInterval(interval); // 🔥 Para de verificar após o pagamento ser confirmado
            } else {
                console.log(`⌛ Aguardando pagamento... Status atual: ${response.data.status}`);
            }

            // 🔥 Para de tentar após atingir o limite de tentativas
            if (++tentativas >= maxTentativas) {
                console.log("⚠️ Tempo limite atingido para verificar o pagamento.");
                alert("⚠️ O status do saque não foi confirmado dentro do tempo limite.");
                clearInterval(interval);
            }
        } catch (error) {
            console.error("❌ Erro ao verificar pagamento:", error);
            clearInterval(interval);
        }
    }, intervalo);
};


  const handleAdicionarSaldo = (premio) => {
    console.log("Adicionar ao saldo prêmio:", premio);
    // Implemente a lógica para adicionar saldo aqui




  };

  

  return (
    <>
      <NavBar />

      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", fontWeight: "bold" }}>
          🎉 Meus Prêmios
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>🔄 Carregando prêmios...</p>
        ) : premios.length === 0 ? (
          <p style={{ textAlign: "center" }}>⚠️ Nenhum prêmio encontrado.</p>
        ) : (
          <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "10px" }}>
            {premios.map((premio, index) => (
              <div key={index} style={{ width: "90%", background: "#ffffff", border: "1px solid #ddd", borderRadius: "12px", boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)", padding: "15px", marginBottom: "15px", transition: "transform 0.3s ease-in-out", margin: "0 auto" }}>
                <h5 style={{ color: "#333", fontWeight: "bold" }}>🏆 Prêmio: {premio.tipo}</h5>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  🎟️ Cartela: <strong>{premio.cartelaId}</strong>
                </p>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  💰 Valor: <strong>R$ {premio.valorPremio},00</strong>
                </p>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  📅 Data: <strong>{new Date(premio.data).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</strong>
                </p>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  🎲 Sorteio ID: <strong>{premio.sorteioId}</strong>
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                  <button onClick={() => handleSacar(premio)} style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                    Sacar
                  </button>
                  <button onClick={() => console.log("Adicionar ao saldo:", premio)} style={{ padding: "6px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                    Adc ao saldo
                  </button>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MeusPremios;
