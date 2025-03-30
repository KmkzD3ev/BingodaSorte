import React, { useEffect, useState, useContext,useCallback,useRef} from "react";
import { BingoContext } from "../contexts/BingoContext";
import { UserContext } from "../contexts/UserContext"; 
import { db } from "../services/firebaseconection";
import { collection, collectionGroup, getDocs, doc, getDoc,addDoc,onSnapshot, updateDoc, arrayUnion,deleteDoc} from "firebase/firestore";
import responsiveVoice from "responsivevoice";
import "./Sorteio.css";
import NavBar from "../Components/NavBar ";
import PainelInfo from "../Components/PainelInfo"
import CartelasFaltantes from "../Cartelas/CartelasFaltantes";
import CardsSorteio from "../Components/CardsSorteio";
import { auth } from "../services/firebaseconection"; // 🔥 Importa autenticação Firebase
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Vencedores from "../Components/Vencedores";
import MonitorSorteios from "../Components/MonitorSorteios";
import { useNavigate } from "react-router-dom";




let sorteioIdGlobal = null;
let dataSorteioGlobal = null;

const Sorteio = () => {
  const { numerosSorteados, setNumerosSorteados, sorteando, setSorteando, numeroAtual, setNumeroAtual,iniciarSorteioExterno, setIniciarSorteioExterno } =
    useContext(BingoContext);
    const { uid } = useContext(UserContext);

  
   

  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vencedores, setVencedores] = useState([]);
  const [mensagemInicialJaExibida, setMensagemInicialJaExibida] = useState(false);



  const [quadraSaiu, setQuadraSaiu] = useState(false);
  const [quinaSaiu, setQuinaSaiu] = useState(false);
  const [cartelaCheiaSaiu, setCartelaCheiaSaiu] = useState(false);
  const navigate = useNavigate();
  const [mensagemInicial, setMensagemInicial] = useState(true);
  const acumuladoPago = useRef(false);

  const sorteioFinalizado = useRef(false);

  
  





  const [coresBolas, setCoresBolas] = useState({
    numeroAtual: "#ffcc00",  // Cor inicial da bola maior
    bolaPequena1: "#ff5733", // Cor inicial da primeira bola menor
    bolaPequena2: "#3498db", // Cor inicial da segunda bola menor
  });


  const [mostrarVencedores, setMostrarVencedores] = useState(false); 
  const [exibindoVencedores, setExibindoVencedores] = useState(false); 


  const sorteandoRef = useRef(false);

useEffect(() => {
  sorteandoRef.current = sorteando;
}, [sorteando]);


  useEffect(() => {
    // 🔥 Garante que sorteioId e data sejam gerados apenas uma vez
    if (!sorteioIdGlobal) {
      sorteioIdGlobal = Date.now().toString();
      dataSorteioGlobal = new Date().toISOString();
      console.log("📌 ID de Sorteio fixado:", sorteioIdGlobal);
    }
  }, []);



  /*useEffect(() => {
    const sorteioRef = doc(db, "sorteio", "atual");
    
    updateDoc(sorteioRef, { executandoNoFrontend: true });
  
    return () => {
      updateDoc(sorteioRef, { executandoNoFrontend: false });
    };
  }, []);*/
  
  /*useEffect(() => {
    if (iniciarSorteioExterno) {
      console.log("🚀 Iniciando sorteio automaticamente via MonitorSorteios!");
  
      // 🔥 Reseta todos os estados necessários imediatamente
      setSorteando(false); // Ainda não ativa sorteando
      setNumerosSorteados([]);
      setNumeroAtual(null);
      setVencedores([]);
      setQuadraSaiu(false);
      setQuinaSaiu(false);
      setCartelaCheiaSaiu(false);
      
      setMensagemInicial(true); // 🔥 Exibe a mensagem imediatamente
  
      setTimeout(() => {
        console.log("🎯 Iniciando primeiro número do sorteio...");
        setMensagemInicial(false); // 🔥 Remove a mensagem após o delay
        setSorteando(true); // 🔥 Agora ativa o sorteio
        
      }, 8000); // 🔥 Aumentado para 10 segundos
  
      setIniciarSorteioExterno(false);
    }
  }, [iniciarSorteioExterno]);*/

  useEffect(() => {
    if (iniciarSorteioExterno && !mensagemInicialJaExibida) {
      setMensagemInicial(true);
      setMensagemInicialJaExibida(true); // 🔒 Marcar como já exibida
      setSorteando(false); // evita início prematuro
  
      setTimeout(() => {
        setMensagemInicial(false);
        setSorteando(true); // ativa sorteio
      }, 8000);
  
      setIniciarSorteioExterno(false);
    }
  }, [iniciarSorteioExterno]);
  


  // 🔥 Reage ao número vindo do backend
useEffect(() => {
  if (!numeroAtual || !sorteandoRef.current) return;

  console.log("🟣 Novo número recebido do backend:", numeroAtual);

  marcarNumeroNasCartelas(numeroAtual);

  // Aguardar pequeno delay antes de verificar vencedores
  setTimeout(() => {
    verificarVencedores();
  }, 100); // 100ms é suficiente
  

  if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) {
    console.log("✅ Todos prêmios saíram. Finalizando sorteio...");
    atualizarStatusExecutadoAgora();
    setSorteando(false);
    salvarSorteioFinalizado(vencedores);
    
  }

  if (numerosSorteados.length >= 90 && !(quadraSaiu && quinaSaiu && cartelaCheiaSaiu)) {
    console.warn("⚠️ 90 números e nenhum ganhador completo. Finalizando sorteio sem prêmios.");
    setSorteando(false);
    salvarSorteioFinalizado(vencedores);
  }

}, [numeroAtual, numerosSorteados, quadraSaiu, quinaSaiu, cartelaCheiaSaiu]);




  
useEffect(() => {
  const timeout = setTimeout(async () => {
    
    const idSorteioAtual = obterIdSorteioDoLocalStorage();
    if (!idSorteioAtual) {
      console.error("⚠️ Nenhum ID de sorteio encontrado no localStorage.");
      setLoading(false);
      return;  // Se não encontrar o ID, sai da execução
    }
    try {
      console.log("🔄 Buscando cartelas avulsas e vinculadas ao sorteio atual...");

      const snapshot = await getDocs(collectionGroup(db, "userCartelas"));

      if (snapshot.empty) {
        console.warn("⚠️ Nenhuma cartela encontrada.");
        setLoading(false);
        return;
      }

      const cartelasTodas = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const cartela = {
          id: doc.id,
          idNumerico: data.idNumerico || "SEM ID",
          userId: doc.ref.parent.parent.id,
          casas: Array.isArray(data.casas) ? data.casas : [],
          marcados: [],
          idSorteioAgendado: data.idSorteioAgendado || null,
        };

        console.log(`📋 Cartela [${index + 1}]:`, {
          id: cartela.id,
          idNumerico: cartela.idNumerico,
          userId: cartela.userId,
          idSorteioAgendado: cartela.idSorteioAgendado,
        });

        return cartela;
      }).filter(cartela =>
        cartela.id !== "init" && cartela.idNumerico !== "init"
      );

      const cartelasAvulsas = cartelasTodas.filter(c => c.idSorteioAgendado === null);
      const cartelasVinculadas = cartelasTodas.filter(c => c.idSorteioAgendado === idSorteioAtual);

      const cartelasFiltradas = [...cartelasAvulsas, ...cartelasVinculadas];

      console.log(`📦 Total de cartelas encontradas: ${cartelasTodas.length}`);
      console.log(`🟢 Cartelas AVULSAS: ${cartelasAvulsas.length}`);
      console.log(`🔵 Cartelas VINCULADAS ao sorteio atual (${idSorteioAtual}): ${cartelasVinculadas.length}`);
      console.log("📌 Cartelas selecionadas para uso:", cartelasFiltradas);

      setCartelas(cartelasFiltradas);
      recuperarNomesUsuarios(cartelasFiltradas);
    } catch (error) {
      console.error("🔥 Erro ao recuperar cartelas:", error);
    }

    setLoading(false);
  }, 8000); // ⏱️ Delay de 8 segundos

  return () => clearTimeout(timeout);
}, []);
////////////////////////////////////////////////////////////////////////

// 🔁 [SYNC INICIAL] Executa apenas para quem entrou após o início do sorteio
useEffect(() => {
  const syncSeUsuarioEntrouDepois = async () => {
    try {
      const docRef = doc(db, "sorteio", "atual");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const jaComecou = Array.isArray(data.numerosSorteados) && data.numerosSorteados.length > 0;

      if (jaComecou) {
        console.log("📌 Novo usuário detectado após início do sorteio. Sincronizando estado completo...");

        setNumerosSorteados(data.numerosSorteados || []);
        setNumeroAtual(data.numeroAtual || null);
        setSorteando(true);

        marcarNumeroNasCartelasEmMassa(data.numerosSorteados || []);
        verificarVencedores();

        // 🔥 NOVO: Verifica se o sorteio já foi finalizado
        const idReal = localStorage.getItem("idSorteioAgendado");
        if (idReal) {
          const sorteioAgendadoRef = doc(db, "sorteios_agendados", idReal);
          const sorteioAgendadoSnap = await getDoc(sorteioAgendadoRef);

          if (sorteioAgendadoSnap.exists() && sorteioAgendadoSnap.data().status === "executado") {
            console.log("✅ Sorteio já foi finalizado. Buscando vencedores...");

            // 🔍 Busca o resultado final
            const finalizadosSnap = await getDocs(collection(db, "Sorteios Finalizados"));
            finalizadosSnap.forEach((doc) => {
              const sorteioData = doc.data();
              if (sorteioData.sorteioId === idReal || sorteioData.sorteioId === sorteioIdGlobal) {
                setVencedores(sorteioData.vencedores || []);
                console.log("🏆 Vencedores carregados do Firestore:", sorteioData.vencedores);
              }
            });

            // ⏳ Redireciona o usuário depois de uns segundos
            setTimeout(() => {
              navigate("/Home");
            }, 5000);
          }
        }
      }
    } catch (err) {
      console.error("❌ Erro ao sincronizar usuário novo:", err);
    }
  };

  syncSeUsuarioEntrouDepois();
}, []);



  //////////////////////////////////////////////////////////////////////
  const obterIdSorteioDoLocalStorage = () => {
    const idSorteio = localStorage.getItem("idSorteioAgendado");
  
    if (!idSorteio) {
      console.error("⚠️ Nenhum ID de sorteio encontrado no localStorage.");
      return null;
    }
  
    console.log("✅ ID de sorteio encontrado:", idSorteio);
    return idSorteio;
  };
//////////////////////////////////////////////////  

const recuperarNomesUsuarios = async (cartelas) => {
  try {
    console.log("🔍 Buscando nomes dos usuários...");

    // 🔥 Buscar todos os usuários de uma vez só
    const usuariosSnapshot = await getDocs(collection(db, "usuarios"));

    // 🔥 Criar um dicionário rápido de { userId: nome }
    const usuariosMap = {};
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      usuariosMap[doc.id] = data.nome || "Sem Nome";
    });

    console.log("📌 Mapeamento de usuários:", usuariosMap);

    // 🔥 Atualizar as cartelas com os nomes correspondentes
    const cartelasComNomes = cartelas.map((cartela) => ({
      ...cartela,
      userName: usuariosMap[cartela.userId] || "Não encontrado",
    }));

    console.log("📌 Cartelas ATUALIZADAS com nomes:", cartelasComNomes);
    setCartelas(cartelasComNomes);

    // 🔁 Se já existem números sorteados, reexecuta a marcação e verificação com cartelas atualizadas
if (numerosSorteados.length > 0) {
  marcarNumeroNasCartelasEmMassa(numerosSorteados);
  verificarVencedores();
}

    
  } catch (error) {
    console.error("🔥 Erro ao recuperar nomes dos usuários:", error);
  }
};

const sortearNumero = async () => {
  if (!sorteando || sorteioFinalizado) return;

  if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) {
    sorteioFinalizado.current = true;

    setSorteando(false);
    await salvarSorteioFinalizado(vencedores);
    return;
  }

  if (numerosSorteados.length >= 90) {
    sorteioFinalizado.current = true;

    setSorteando(false);
    await salvarSorteioFinalizado(vencedores);
    return;
  }

  let novoNumero;
  do {
    novoNumero = Math.floor(Math.random() * 90) + 1;
  } while (numerosSorteados.includes(novoNumero));

  setNumeroAtual(novoNumero);
  setNumerosSorteados((prev) => [...prev, novoNumero]);

  try {
    await updateDoc(doc(db, "sorteio", "atual"), {
      numerosSorteados: arrayUnion(novoNumero),
      numeroAtual: novoNumero,
    });
    marcarNumeroNasCartelas(novoNumero);
    verificarVencedores();
  } catch (error) {
    console.error("Erro ao atualizar Firestore:", error);
  }
};



  const marcarNumeroNasCartelas = useCallback((numero) => {
    setCartelas((prevCartelas) =>
      prevCartelas.map((cartela) => {
        if (cartela.casas.includes(numero)) {
          return { ...cartela, marcados: [...cartela.marcados, numero] };
        }
        return cartela;
      })
    );
  }, []);
  
  ///////////////////////////////////////////////
  const verificarVencedores = async () => {

    if (sorteioFinalizado.current) return;

  
    let encontrouQuadra = false;
    let encontrouQuina = false;
    let encontrouCartelaCheia = false;
    const novos = [];
  
    for (const cartela of cartelas) {
      const linhas = [
        [cartela.casas[0], cartela.casas[5], cartela.casas[10], cartela.casas[15], cartela.casas[20]],
        [cartela.casas[1], cartela.casas[6], cartela.casas[11], cartela.casas[16], cartela.casas[21]],
        [cartela.casas[2], cartela.casas[7], cartela.casas[12], cartela.casas[17], cartela.casas[22]],
        [cartela.casas[3], cartela.casas[8], cartela.casas[13], cartela.casas[18], cartela.casas[23]],
        [cartela.casas[4], cartela.casas[9], cartela.casas[14], cartela.casas[19], cartela.casas[24]],
      ];
      
  
  
      for (const linha of linhas) {
        const marcados = linha.filter((n) => cartela.marcados.includes(n)).length;
        if (!quadraSaiu && marcados === 4 && !encontrouQuadra) {
          encontrouQuadra = true;
          novos.push({ ...info(cartela), tipo: "Quadra" });
        }
        if (!quinaSaiu && marcados === 5 && !encontrouQuina) {
          encontrouQuina = true;
          novos.push({ ...info(cartela), tipo: "Quina" });
        }
      }
  
      if (!cartelaCheiaSaiu && cartela.marcados.length === 25 && !encontrouCartelaCheia) {
        encontrouCartelaCheia = true;
        novos.push({ ...info(cartela), tipo: "Cartela Cheia" });
      }
    }
  
    if (novos.length > 0) {

      const filtrados = [];

      if (encontrouQuadra) {
        const primeiroQuadra = novos.find(
          (n) => n.tipo === "Quadra" && !vencedores.some(v => v.tipo === "Quadra" && v.cartelaId === n.cartelaId)
        );
        if (primeiroQuadra) filtrados.push(primeiroQuadra);
      }
      
      if (encontrouQuina) {
        const primeiroQuina = novos.find(
          (n) => n.tipo === "Quina" && !vencedores.some(v => v.tipo === "Quina" && v.cartelaId === n.cartelaId)
        );
        if (primeiroQuina) filtrados.push(primeiroQuina);
      }
      
      if (encontrouCartelaCheia) {
        const primeiroCheia = novos.find(
          (n) => n.tipo === "Cartela Cheia" && !vencedores.some(v => v.tipo === "Cartela Cheia" && v.cartelaId === n.cartelaId)
        );
        if (primeiroCheia) filtrados.push(primeiroCheia);
      }
      

setVencedores((prev) => [...prev, ...filtrados]);
salvarVitoriaUsuario(filtrados);

      if (encontrouQuadra) setQuadraSaiu(true);
      if (encontrouQuina) setQuinaSaiu(true);
      if (encontrouCartelaCheia) setCartelaCheiaSaiu(true);
  
    //  setVencedores((prev) => [...prev, ...novos]);
      //salvarVitoriaUsuario(novos);
  
      if (
        encontrouQuadra &&
        encontrouQuina &&
        encontrouCartelaCheia
      ) {
        await atualizarStatusExecutadoAgora(); 
        sorteioFinalizado.current = true;
        setSorteando(false);
        salvarSorteioFinalizado([...vencedores, ...novos]);
      }
    }
  };
  
  const info = (cartela) => ({
    userName: cartela.userName,
    cartelaId: cartela.idNumerico,
    userId: cartela.userId,
  });


  

  const atualizarStatusExecutadoAgora = async () => {
    const idReal = localStorage.getItem("idSorteioAgendado");
  
    if (!idReal) {
      console.warn("⚠️ [atualizarStatusExecutadoAgora] ID não encontrado no localStorage.");
      return;
    }
  
    try {
      await updateDoc(doc(db, "sorteios_agendados", idReal), {
        status: "executado"
      });
  
      const agora = new Date().toLocaleTimeString(); // pega a hora no formato local, tipo "14:35:08"
  
      console.log(`✅ [atualizarStatusExecutadoAgora] Status 'executado' enviado imediatamente para: ${idReal} às ${agora}`);
      //alert(`✅ Status 'executado' enviado com sucesso para o sorteio: ${idReal} às ${agora}`);
  
    } catch (error) {
      console.error("🔥 Erro ao atualizar status pra 'executado':", error);
    }
  };
  
 /* const verificarVencedores = () => {
    let novosVencedores = [];
    
    cartelas.forEach((cartela) => {
      const linhas = [
        cartela.casas.slice(0, 5),
        cartela.casas.slice(5, 10),
        cartela.casas.slice(10, 15),
        cartela.casas.slice(15, 20),
        cartela.casas.slice(20, 25),
      ];
  
      linhas.forEach((linha, index) => {
        const marcadosNaLinha = linha.filter((num) => cartela.marcados.includes(num)).length;
  
        // 🔥 Se QUADRA ainda não saiu, verifica
        if (!quadraSaiu && marcadosNaLinha === 4) {
          console.log(`🏆 QUADRA - Usuário: ${cartela.userName}, Cartela: ${cartela.idNumerico}, Linha: ${index + 1}`);
          novosVencedores.push({ 
            userName: cartela.userName, 
            tipo: "Quadra", 
            cartelaId: cartela.idNumerico, 
            linha: index + 1
          });
        }
  
        // 🔥 Se QUINA ainda não saiu, verifica
        if (!quinaSaiu && marcadosNaLinha === 5) {
          console.log(`🏆 QUINA - Usuário: ${cartela.userName}, Cartela: ${cartela.idNumerico}, Linha: ${index + 1}`);
          novosVencedores.push({ 
            userName: cartela.userName, 
            tipo: "Quina", 
            cartelaId: cartela.idNumerico, 
            linha: index + 1
          });
        }
      });
  
      // 🔥 Se CARTELA CHEIA ainda não saiu, verifica
      if (!cartelaCheiaSaiu && cartela.marcados.length === 25) {
        console.log(`🏆 CARTELA CHEIA - Usuário: ${cartela.userName}, Cartela: ${cartela.idNumerico}`);
        novosVencedores.push({ 
          userName: cartela.userName, 
          tipo: "Cartela Cheia", 
          cartelaId: cartela.idNumerico 
        });
      }
    });
  
    // 🔥 Atualiza os vencedores
    if (novosVencedores.length > 0) {
      setVencedores((prevVencedores) => [...prevVencedores, ...novosVencedores]);

      salvarVitoriaUsuario(novosVencedores);

      
      // 🔥 Se houver novos vencedores, ativa a flag correspondente
      if (novosVencedores.some(v => v.tipo === "Quadra")) setQuadraSaiu(true);
      if (novosVencedores.some(v => v.tipo === "Quina")) setQuinaSaiu(true);
      if (novosVencedores.some(v => v.tipo === "Cartela Cheia")) setCartelaCheiaSaiu(true);
    }
  };*/
  

  useEffect(() => {
    const sorteioRef = doc(db, "sorteio", "atual");
  
    const unsubscribe = onSnapshot(sorteioRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setNumerosSorteados(data.numerosSorteados || []);
        setNumeroAtual(data.numeroAtual || null);
  
        if (data.numerosSorteados?.length > 0 && !sorteandoRef.current) {
          setSorteando(true);
        }
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  
  /*********************************************/

  const narrarNumero = (numero) => {
    if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) {
      console.log("🛑 Narração cancelada: sorteio encerrado.");
      return;
    }
  
    if (!window.speechSynthesis) {
      console.warn("🚨 Web Speech API não suportada neste navegador.");
      return;
    }
  
    const fala = new SpeechSynthesisUtterance(`Número sorteado: ${numero}`);
    fala.lang = "pt-BR"; // Português do Brasil
    fala.rate = 0.9; // Velocidade da voz
    fala.pitch = 1; // Tom da voz
  
    // Espera o carregamento das vozes antes de definir uma específica
    const definirVoz = () => {
      const voices = window.speechSynthesis.getVoices();
      const vozBR = voices.find((voice) =>
        voice.lang.toLowerCase().includes("pt-br")
      );
  
      if (vozBR) {
        fala.voice = vozBR;
      }
  
      window.speechSynthesis.speak(fala);
    };
  
    if (window.speechSynthesis.getVoices().length > 0) {
      definirVoz();
    } else {
      window.speechSynthesis.onvoiceschanged = definirVoz;
    }
  };
  
  


  /***************************************************/
  const salvarSorteioFinalizado = async (vencedores) => {
    if (vencedores.length === 0) return;
  
    if (sorteioFinalizado.current) {
      console.warn("⛔ Sorteio já foi finalizado. Ignorando chamada duplicada.");
      return;
    }
  
    sorteioFinalizado.current = true; // 🔒 BLOQUEIO imediato
  
    try {
      await addDoc(collection(db, "Sorteios Finalizados"), {
        sorteioId: sorteioIdGlobal,
        data: dataSorteioGlobal,
        vencedores: vencedores.map((v) => ({
          usuario: v.userName,
          cartela: v.cartelaId,
          tipo: v.tipo,
        })),
      });
  
      console.log("✅ Sorteio finalizado salvo no Firebase:", sorteioIdGlobal);
  
      await resetarSorteio();
      await deletarTodasCartelas();
  
      const idReal = localStorage.getItem("idSorteioAgendado");
      if (idReal) {
        await updateDoc(doc(db, "sorteios_agendados", idReal), {
          status: "executado"
        });
      }
  
      setTimeout(() => {
        navigate("/Home");
      }, 6000);
  
    } catch (error) {
      console.error("🔥 Erro ao salvar sorteio finalizado:", error);
    }
  };
  
  /////////////////////////////////////
  const gerarCorAleatoria = () => {
    const letras = "0123456789ABCDEF";
    let cor = "#";
    for (let i = 0; i < 6; i++) {
      cor += letras[Math.floor(Math.random() * 16)];
    }
    return cor;
  };

  useEffect(() => {
    if (numerosSorteados.length > 0) {
      setCoresBolas({
        numeroAtual: gerarCorAleatoria(),
        bolaPequena1: gerarCorAleatoria(),
        bolaPequena2: gerarCorAleatoria(),
      });
    }
  }, [numerosSorteados]); // ⚡ Dispara quando um novo número é sorteado
  
  ////////////////////////////////
  const calcularNumerosFaltando = () => {
    return cartelas.map(cartela => {
      const numerosFaltando = cartela.casas.filter(num => !numerosSorteados.includes(num));
      return {
        idCartela: cartela.idNumerico,
        userName: cartela.userName,
        numerosFaltando
      };
    });
  };
  
  ///////////////////////////////////////////////////////////////
  const salvarVitoriaUsuario = async (vencedores) => {
    try {
        console.log("📌 [salvarVitoriaUsuario] Vencedores recebidos:", vencedores);

        if (!vencedores || vencedores.length === 0) {
            console.warn("⚠️ Nenhum vencedor para salvar.");
            return;
        }

        // 🔥 Recupera os valores do sorteio (incluindo acumulado)
        const sorteioData = JSON.parse(localStorage.getItem('dadosSorteio') || '{}');


        console.log("📌 Valores do Sorteio Recuperados:", sorteioData);

        for (const vencedor of vencedores) {
            if (!vencedor.userId) {
                console.error("❌ ERRO: ID do usuário não encontrado!", vencedor);
                continue;
            }

            let valorPremio = 0;

            if (vencedor.tipo === "Quadra") {
                valorPremio = sorteioData.primeiro || 0;
            } else if (vencedor.tipo === "Quina") {
                valorPremio = sorteioData.segundo || 0;
            } else if (vencedor.tipo === "Cartela Cheia") {
                valorPremio = sorteioData.terceiro || 0;
            }

            // 🔥 Verifica se atingiu a quantidade de bolas sorteadas para pagar o acumulado
            let ganhouAcumulado = false;
            let valorAcumulado = 0;
            
            if (!acumuladoPago.current && numerosSorteados.length >= sorteioData.quantidadeAcumulado) {
              ganhouAcumulado = true;
              valorAcumulado = sorteioData.acumulado || 0;
              acumuladoPago.current = true; // ✅ Marca imediatamente como pago
          }
          
            // 🔥 Referência ao documento do usuário no Firestore
            const userRef = doc(db, "usuarios", vencedor.userId);

            // 🔥 Obtém os prêmios atuais para evitar duplicação
            const userSnap = await getDoc(userRef);
            let premiosAtuais = [];
            if (userSnap.exists()) {
                premiosAtuais = userSnap.data().premios || [];
            }

            // 🔥 Verifica se o prêmio já foi concedido ao usuário
            const jaGanhou = premiosAtuais.some(premio =>
                premio.tipo === vencedor.tipo &&
                premio.cartelaId === vencedor.cartelaId
            );

            if (jaGanhou) {
                console.warn(`⚠️ Usuário ${vencedor.userName} já recebeu o prêmio ${vencedor.tipo}. Pulando...`);
                continue;
            }

            console.log("📌 Salvando vitória para usuário:", {
                userId: vencedor.userId,
                nome: vencedor.userName,
                tipo: vencedor.tipo,
                cartelaId: vencedor.cartelaId,
                valorPremio: valorPremio,
                ganhouAcumulado: ganhouAcumulado,
                valorAcumulado: valorAcumulado,
                timestamp: new Date().toISOString(),
            });

            // 🔥 Tenta atualizar o Firestore
            await updateDoc(userRef, {
                premios: arrayUnion({
                  sorteioId:  sorteioIdGlobal,
                  data: dataSorteioGlobal,
                    tipo: vencedor.tipo,
                    cartelaId: vencedor.cartelaId,
                    valorPremio: valorPremio,
                    valorAcumulado: ganhouAcumulado ? valorAcumulado : 0,
                    
                }),
            });

            console.log(`✅ Vitória salva com sucesso: ${vencedor.userName} (${vencedor.tipo}) - R$ ${valorPremio},00 ${ganhouAcumulado ? `+ Acumulado: R$ ${valorAcumulado},00` : ''}`);
        }
    } catch (error) {
        console.error("🔥 ERRO AO SALVAR VITÓRIA NO FIRESTORE:", error);
        alert("Erro ao salvar vitória no Firestore. Verifique o console.");
    }
};

  /*const salvarVitoriaUsuario = async (vencedores) => {
    try {
        console.log("📌 [salvarVitoriaUsuario] Vencedores recebidos:", vencedores);

        if (!vencedores || vencedores.length === 0) {
            console.warn("⚠️ Nenhum vencedor para salvar.");
            return;
        }

        // 🔥 Recupera os valores de prêmio salvos no localStorage
       // const sorteioData = JSON.parse(localStorage.getItem('dadosSorteio') || '{}');
       const sorteioData = JSON.parse(localStorage.getItem('sorteioData') || '{}');

        
  
          console.log("📌 Valores do Sorteio Recuperados:", sorteioData);

        for (const vencedor of vencedores) {
            if (!vencedor.userId) {
                console.error("❌ ERRO: ID do usuário não encontrado!", vencedor);
                continue; // 🔥 Pula para o próximo vencedor se `userId` estiver ausente
            }

            let valorPremio = 0;

            // 🔥 Agora pegamos as chaves corretas
            if (vencedor.tipo === "Quadra") {
              valorPremio = sorteioData.primeiro || 0;  // ✅ CORRETO
          } else if (vencedor.tipo === "Quina") {
              valorPremio = sorteioData.segundo || 0;   // ✅ CORRETO
          } else if (vencedor.tipo === "Cartela Cheia") {
              valorPremio = sorteioData.terceiro || 0;  // ✅ CORRETO
          }


            // 🔥 Referência ao documento do usuário no Firestore
            const userRef = doc(db, "usuarios", vencedor.userId);

           // 🔥 Obtém os prêmios atuais para evitar duplicação
           const userSnap = await getDoc(userRef);
           let premiosAtuais = [];
           if (userSnap.exists()) {
               premiosAtuais = userSnap.data().premios || [];
           }

           // 🔥 Verifica se o prêmio já foi concedido ao usuário
           const jaGanhou = premiosAtuais.some(premio =>
               premio.tipo === vencedor.tipo &&
               premio.cartelaId === vencedor.cartelaId
           );

           if (jaGanhou) {
               console.warn(`⚠️ Usuário ${vencedor.userName} já recebeu o prêmio ${vencedor.tipo}. Pulando...`);
               continue;
           }

           // 🔍 Loga os dados antes de salvar
           console.log("📌 Salvando vitória para usuário:", {
               userId: vencedor.userId,
               nome: vencedor.userName,
               tipo: vencedor.tipo,
               cartelaId: vencedor.cartelaId,
               valorPremio: valorPremio,
               timestamp: new Date().toISOString(),
           });

            // 🔥 Tenta atualizar o Firestore
            await updateDoc(userRef, {
                premios: arrayUnion({
                    sorteioId: Date.now().toString(),
                    tipo: vencedor.tipo,
                    cartelaId: vencedor.cartelaId,
                    valorPremio: valorPremio,
                    data: new Date().toISOString(),
                }),
            });

            console.log(`✅ Vitória salva com sucesso: ${vencedor.userName} (${vencedor.tipo}) - R$ ${valorPremio},00`);
        }
    } catch (error) {
        console.error("🔥 ERRO AO SALVAR VITÓRIA NO FIRESTORE:", error);
        alert("Erro ao salvar vitória no Firestore. Verifique o console.");
    }
};*/

  
/////////////////////////////////////////////////////////
const resetarSorteio = async () => {
  try {
    const sorteioRef = doc(db, "sorteio", "atual"); // Referência ao documento no Firestore

    await updateDoc(sorteioRef, {
      numeroAtual: 0,           // 🔥 Zera o número atual
      numerosSorteados: []      // 🔥 Reseta o array de números sorteados
    });

    console.log("✅ Sorteio resetado com sucesso!");
    //alert("Sorteio resetado!");
  } catch (error) {
    console.error("❌ Erro ao resetar sorteio:", error);
    alert("Erro ao resetar sorteio. Verifique o console.");
  }
};

const deletarTodasCartelas = async () => {
  console.log("🧪 [DEBUG] deletarTodasCartelas foi chamada");

  try {
    const snapshot = await getDocs(collectionGroup(db, "userCartelas"));
    const idSorteioFinalizado = localStorage.getItem("idSorteioAgendado");

    if (snapshot.empty) {
      console.log("📭 Nenhuma cartela encontrada na subcoleção 'userCartelas'.");
      return;
    }

    const cartelasParaExcluir = snapshot.docs.filter((doc) => {
      const data = doc.data();
      const idSorteio = data.idSorteioAgendado || null;

      // Só apaga se for avulsa (null) ou do sorteio que acabou
      return idSorteio === null || idSorteio === idSorteioFinalizado;
    });

    console.log(`🧹 Total a excluir: ${cartelasParaExcluir.length}`);
    console.log(`🟢 Avulsas + 🔵 do sorteio finalizado (${idSorteioFinalizado})`);

    const deletarCartelas = cartelasParaExcluir.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletarCartelas);
    localStorage.removeItem("idSorteioAgendado");
    console.log("🧹 ID do sorteio removido do localStorage:", localStorage.getItem("idSorteioAgendado")); 


    console.log("✅ Cartelas deletadas com sucesso.");
  } catch (error) {
    console.error("🔥 Erro ao deletar cartelas:", error);
  }
};

const marcarNumeroNasCartelasEmMassa = (numeros) => {
  setCartelas((cartelasAnteriores) =>
    cartelasAnteriores.map((cartela) => {
      const novosMarcados = cartela.casas.filter((numero) =>
        numeros.includes(numero)
      );
      return {
        ...cartela,
        marcados: novosMarcados,
      };
    })
  );
};




  

 // console.log("✅ [Sorteio] Renderizando! Cartelas no contexto:", useContext(UserContext).cartelas);


  return (
    <div> 
                    {mensagemInicial && (
  <div
    style={{
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#ffffff",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
      zIndex: 9999,
    }}
  >
    🕒 O sorteio já vai começar...
  </div>
)}

  <div className="painel-info-container">
       <PainelInfo mostrarCartelas={true} className="painel-sorteio-ajuste"  
       />
        <MonitorSorteios />
  
    <div className="sorteio-container">

     
      
      <div className="bolas-container">
  {/* Bola maior (Número atual) */}
  <div className="numero-atual" style={{ backgroundColor: coresBolas.numeroAtual }}>
    <span className="bola">{numeroAtual !== null ? numeroAtual : "..."}</span>
  </div>

  {/* Duas bolas menores com os números anteriores */}
  <div className="bolas-menores">
    <div className="bola-pequena1" style={{ backgroundColor: coresBolas.bolaPequena1 }}>
      <span>{numerosSorteados.length > 1 ? numerosSorteados[numerosSorteados.length - 2] : "-"}</span>
    </div>
    <div className="bola-pequena2" style={{ backgroundColor: coresBolas.bolaPequena2 }}>
      <span>{numerosSorteados.length > 2 ? numerosSorteados[numerosSorteados.length - 3] : "-"}</span>
    </div>
  </div>
</div>


      <div className="numeros-sorteados">
        {numerosSorteados.map((num, index) => (
          <span key={index} className="numero-sorteado">{num}</span>
        ))}
      </div>

     <div>
     <Vencedores vencedores={vencedores} />

     </div>

    <CartelasFaltantes cartelas={cartelas} numerosSorteados={numerosSorteados} />
    </div>
   

    </div>
    </div>

  );
};

export default Sorteio; 