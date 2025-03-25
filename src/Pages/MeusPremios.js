import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebaseconection";
import { doc, getDoc,updateDoc } from "firebase/firestore";
import NavBar from "../Components/NavBar ";
import { getAuthToken } from "../apiServices/AuthApi"; 
import axios from "axios";
import { cpf } from "cpf-cnpj-validator"; // no topo do arquivo


// https://backend-proxy-6x3n.onrender.com/proxy/pagamento
/***
 * URL PARA SOLICITAR PAGMENTO
 * 
 */
const MeusPremios = () => {
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saquesConcluidos, setSaquesConcluidos] = useState([]);
  const [valorSaqueAtual, setValorSaqueAtual] = useState(0);
  const [loadingSaque, setLoadingSaque] = useState(false);


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

        const premiosDisponiveis = premiosUsuario.filter(premio => premio.status !== "sacado");

        setPremios(premiosDisponiveis);

      } catch (error) {
        console.error("🔥 Erro ao buscar prêmios do usuário:", error);
      }
      setLoading(false);
    };

    buscarPremios();
  }, []);



  const handleSacar = async (premio) => {
    setLoadingSaque(true);
    const valorAcumulado = premio.valorAcumulado || 0;
const valorTotal = premio.valorPremio + valorAcumulado;



    try {
        const user = auth.currentUser;
        if (!user) {
            console.log("⚠️ Nenhum usuário autenticado.");
            return;
        }

        // 🔥 Obtendo dados do usuário do Firestore
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
//AGUARDANDO LIBERAÇAO

        if (!userSnap.exists()) {
            console.log("❌ Usuário não encontrado no Firestore.");
            return;
        }

        const userData = userSnap.data();
        const chavePix = userData.chavePix;
          const pixKeyType = userData.tipoPix; // 🔥 Usa direto o tipo salvo no cadastro
           const cpf = userData.cpf;
             const nome = userData.nome;

if (!chavePix || !pixKeyType || !nome) {
    console.log("❌ Dados do usuário incompletos para saque.");
    return;
}


        if (!chavePix || !nome) {
            console.log("❌ Dados do usuário incompletos para saque.");
            return;
        }

    // 🔥 Detectar automaticamente o tipo de chave Pix
   
    
      

        // 🔥 Criando requisição de pagamento Pix
        const requestData = {
            initiation_type: "dict",
            idempotent_id: `SAQUE_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            receiver_name: nome,
            value_cents: valorTotal * 100,// Convertendo para centavos
            pix_key_type: pixKeyType,
            pix_key: chavePix,
            authorized: true

          
            //FALTA DE AUTORIZAÇAO
        };

        setValorSaqueAtual(valorTotal);


        // 🔥 Se a chave for CPF ou CNPJ, adicionamos receiver_document
        if (pixKeyType === "cpf" || pixKeyType === "cnpj") {
            requestData.receiver_document = cpf;
        }

        console.log("📌 Enviando solicitação de saque:", JSON.stringify(requestData, null, 2));

        const token = await getAuthToken();
        //console.log("🔑 Token de autenticação:", token);

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
        verificarPagamentoSaque(referenceCode, premio.sorteioId, premio.valorPremio);
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

function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}



  const verificarPagamentoSaque = async (referenceCode, sorteioId,valorPremio) => {
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


                
                const user = auth.currentUser;
                if (!user) {
                    console.log("⚠️ Nenhum usuário autenticado.");
                    clearInterval(interval);
                    return;
                }

                const userRef = doc(db, "usuarios", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    console.log("❌ Usuário não encontrado no Firestore.");
                    clearInterval(interval);
                    return;
                }

                const userData = userSnap.data();
                const saqueAtual = userData.saquePix || 0;
                const novoSaquePix = saqueAtual + valorPremio; // 🔥 Usando o valor recebido como argumento


                console.log(`💰 Atualizando saquePix: ${saqueAtual} ➡️ ${novoSaquePix}`);

                 // 🔥 Atualizando Firestore (saldo + marcar prêmio como sacado)
                 let premiosAtualizados = userData.premios.map(premio =>
                  premio.sorteioId === sorteioId ? { ...premio, status: "sacado" } : premio
              );

                await updateDoc(userRef, {
                    saquePix: novoSaquePix,
                    premios: premiosAtualizados
                });

                

                setSaquesConcluidos((prev) => [...prev, sorteioId]);

                setLoadingSaque(false);

                clearInterval(interval); // 🔥 Para de verificar após o pagamento ser confirmado
            } else {
                console.log(`⌛ Aguardando pagamento... Status atual: ${response.data.status}`);
            }

            // 🔥 Para de tentar após atingir o limite de tentativas
            if (++tentativas >= maxTentativas) {
                console.log("⚠️ Tempo limite atingido para verificar o pagamento.");
                alert("⚠️ O status do saque não foi confirmado dentro do tempo limite.");
                setLoadingSaque(false);
                clearInterval(interval);
            }
        } catch (error) {
            console.error("❌ Erro ao verificar pagamento:", error);
            clearInterval(interval);
        }
    }, intervalo);
};


const handleAdicionarSaldo = async (premio) => {
  const valorAcumulado = premio.valorAcumulado || 0;
const valorTotal = premio.valorPremio + valorAcumulado;

  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("⚠️ Nenhum usuário autenticado.");
      return;
    }

    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("❌ Usuário não encontrado no Firestore.");
      return;
    }

    const userData = userSnap.data();
    const saldoAtual = userData.saldo || 0;
    const novoSaldo = saldoAtual + valorTotal;


    console.log(`💰 Adicionando prêmio ao saldo: ${saldoAtual} ➡️ ${novoSaldo}`);

    // 🔥 Atualizando Firestore (saldo + marcar prêmio como sacado)
    let premiosAtualizados = userData.premios.map(p =>
      p.sorteioId === premio.sorteioId ? { ...p, status: "sacado" } : p
    );

    await updateDoc(userRef, {
      saldo: novoSaldo,
      premios: premiosAtualizados
    });

    // 🔥 Remove o prêmio da interface
    setPremios((prevPremios) =>
      prevPremios.filter(p => p.sorteioId !== premio.sorteioId)
    );

    console.log(`✅ Prêmio total de R$${valorTotal},00 adicionado ao saldo!`);
    alert(`✅ R$${valorTotal},00 foi adicionado ao seu saldo com sucesso!`);
    
  } catch (error) {
    console.error("❌ Erro ao adicionar prêmio ao saldo:", error);
    alert("❌ Erro ao adicionar saldo. Verifique o console.");
  }
};




  

  return (
    <>
      <NavBar />

      
  <style>{`
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
      border: 5px solid #28a745;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
  

      {loadingSaque && (
  <div className="spinner-container">
    <div className="spinner"></div>
    <p>Processando saque Pix...</p>
  </div>
)}

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
                {(() => {
  const acumulado = premio.valorAcumulado || 0;
  const total = premio.valorPremio + acumulado;

  return (
    <>
      <p style={{ fontSize: "14px", color: "#666" }}>
        💰 Valor: <strong>R$ {total},00</strong>
      </p>
      {acumulado > 0 && (
        <p style={{ fontSize: "13px", color: "#999" }}>
          🔄 Inclui R$ {acumulado},00 de acumulado
        </p>
      )}
    </>
  );
})()}

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

                {saquesConcluidos.includes(premio.sorteioId) ? (
  // ✅ Se o prêmio já foi sacado, exibe apenas "Saque Concluído!" e oculta os botões
  <p style={{ color: "green", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>
    ✅ Saque Concluído!
  </p>
) : (
  // 🔥 Caso contrário, mantém os botões visíveis
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
    <button onClick={() => handleSacar(premio)} style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
      Sacar
    </button>
    <button 
    onClick={() => handleAdicionarSaldo(premio)} 
    style={{ 
      padding: "6px 12px", 
      background: "#007bff", 
      color: "#fff", 
      border: "none", 
      borderRadius: "5px", 
      cursor: "pointer" 
    }}
  >
    Adc ao saldo
  </button>
  </div>
)}

              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MeusPremios;
