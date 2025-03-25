import React, { useEffect, useState, useContext,useCallback,useRef} from "react";
import { BingoContext } from "../contexts/BingoContext";
import { UserContext } from "../contexts/UserContext"; 
import { db } from "../services/firebaseconection";
import { collection, collectionGroup, getDocs, doc, getDoc,addDoc,onSnapshot, updateDoc, arrayUnion,deleteDoc} from "firebase/firestore";
import responsiveVoice from "responsivevoice";
import "./Sorteio.css";
import NavBar from "../Components/NavBar";
import PainelInfo from "../Components/PainelInfo"
import CartelasFaltantes from "../Cartelas/CartelasFaltantes";
import CardsSorteio from "../Components/CardsSorteio";
import { auth } from "../services/firebaseconection"; // 🔥 Importa autenticação Firebase
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Vencedores from "../Components/Vencedores";
import MonitorSorteios from "../Components/MonitorSorteios";



let sorteioIdGlobal = null;
let dataSorteioGlobal = null;

const Sorteio = () => {
  const { numerosSorteados, setNumerosSorteados, sorteando, setSorteando, numeroAtual, setNumeroAtual,iniciarSorteioExterno, setIniciarSorteioExterno } =
    useContext(BingoContext);
    const { uid } = useContext(UserContext);

  
   

  const [cartelas, setCartelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vencedores, setVencedores] = useState([]);

  const [quadraSaiu, setQuadraSaiu] = useState(false);
  const [quinaSaiu, setQuinaSaiu] = useState(false);
  const [cartelaCheiaSaiu, setCartelaCheiaSaiu] = useState(false);



  const [coresBolas, setCoresBolas] = useState({
    numeroAtual: "#ffcc00",  // Cor inicial da bola maior
    bolaPequena1: "#ff5733", // Cor inicial da primeira bola menor
    bolaPequena2: "#3498db", // Cor inicial da segunda bola menor
  });


  const [mostrarVencedores, setMostrarVencedores] = useState(false); 
  const [exibindoVencedores, setExibindoVencedores] = useState(false); 

  useEffect(() => {
    // 🔥 Garante que sorteioId e data sejam gerados apenas uma vez
    if (!sorteioIdGlobal) {
      sorteioIdGlobal = Date.now().toString();
      dataSorteioGlobal = new Date().toISOString();
      console.log("📌 ID de Sorteio fixado:", sorteioIdGlobal);
    }
  }, []);



  useEffect(() => {
    const sorteioRef = doc(db, "sorteio", "atual");
    
    updateDoc(sorteioRef, { executandoNoFrontend: true });
  
    return () => {
      updateDoc(sorteioRef, { executandoNoFrontend: false });
    };
  }, []);
  

  useEffect(() => {
    if (iniciarSorteioExterno) {
      console.log("🚀 Iniciando sorteio automaticamente via MonitorSorteios!");
  
      // 🔥 Reseta todos os estados necessários
      setSorteando(true);  // Ativa o sorteio
      setNumerosSorteados([]);  // Reseta os números sorteados
      setNumeroAtual(null);  // Reseta o último número sorteado
      setVencedores([]);  // Reseta a lista de vencedores
      setQuadraSaiu(false);  // 🔥 Reseta flag da Quadra
      setQuinaSaiu(false);  // 🔥 Reseta flag da Quina
      setCartelaCheiaSaiu(false);  // 🔥 Reseta flag da Cartela Cheia
  
      setTimeout(() => {
        console.log("🎯 Iniciando primeiro número do sorteio...");
        sortearNumero();  // 🔥 Chama a função para iniciar o sorteio automaticamente
      }, 1000); // 🔥 Aguarda 1 segundo antes de iniciar o primeiro número
  
      setIniciarSorteioExterno(false);  // 🔥 Reseta o comando externo para evitar loops
    }
  }, [iniciarSorteioExterno]);
  



  useEffect(() => {
    const sorteioRef = doc(db, "sorteio", "atual");
  
    const unsubscribe = onSnapshot(sorteioRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setNumerosSorteados(data.numerosSorteados || []);
        setNumeroAtual(data.numeroAtual || null);
      }
    });
  
    return () => unsubscribe(); // 🔥 Remove o listener quando o componente desmonta
  }, []);
  

  useEffect(() => {
    const recuperarCartelas = async () => {
      try {
        console.log("🔄 Buscando TODAS as cartelas...");

        // 🔥 Buscar todas as cartelas na coleção 'userCartelas'
        const cartelasSnapshot = await getDocs(collectionGroup(db, "userCartelas"));

        if (cartelasSnapshot.empty) {
          console.warn("⚠️ Nenhuma cartela encontrada.");
          setLoading(false);
          return;
        }

        console.log(`✅ ${cartelasSnapshot.docs.length} cartelas encontradas.`);

        const todasCartelas = cartelasSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            idNumerico: data.idNumerico || "SEM ID",
            userId: doc.ref.parent.parent.id,
            casas: Array.isArray(data.casas) ? data.casas : [],
            marcados: [],
          };
        })
        .filter((cartela) => cartela.id !== "init" && cartela.idNumerico !== "init"); // 🔥 Filtra documentos inválidos
      

        console.log("📌 TODAS AS CARTELAS RECUPERADAS:", todasCartelas);
        setCartelas(todasCartelas);

        recuperarNomesUsuarios(todasCartelas);
        

        console.log("📌 Todas as cartelas recuperadas:", todasCartelas);
        setCartelas(todasCartelas);
      } catch (error) {
        console.error("🔥 Erro ao recuperar cartelas:", error);
      }
      setLoading(false);
    };

    recuperarCartelas();
  }, []);


  //////////////////////////////////////////////////////////////////////

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
    
  } catch (error) {
    console.error("🔥 Erro ao recuperar nomes dos usuários:", error);
  }
};

const sortearNumero = async () => {
  // 🔴 Se os três prêmios saíram, finaliza o sorteio e salva
  if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) {
    setSorteando(false);
    await salvarSorteioFinalizado(vencedores);  // ✅ Chama apenas uma vez
    alert("✅ Sorteio finalizado!");
    return;
  }

  // 🔴 Se já foram sorteados todos os 90 números e ninguém ganhou, finaliza e salva
  if (numerosSorteados.length >= 90) {
    setSorteando(false);
    await salvarSorteioFinalizado(vencedores);  // ✅ Chama apenas uma vez
    alert("⚠️ Sorteio finalizado: Nenhum vencedor!");
    return;
  }

  // 🔥 Gera um novo número único
  let novoNumero;
  do {
    novoNumero = Math.floor(Math.random() * 90) + 1;
  } while (numerosSorteados.includes(novoNumero));

  // Atualiza os estados locais
  setNumeroAtual(novoNumero);
  setNumerosSorteados((prev) => [...prev, novoNumero]);
//NARRAR NUMERO
  //narrarNumero(novoNumero); 

  try {
    const sorteioRef = doc(db, "sorteio", "atual");
    await updateDoc(sorteioRef, {
      numerosSorteados: arrayUnion(novoNumero),
      numeroAtual: novoNumero,
    });

    console.log(`✅ Número ${novoNumero} enviado para Firestore!`);

    // 🔥 Marca número nas cartelas e verifica vencedores
    marcarNumeroNasCartelas(novoNumero);
    verificarVencedores();
  } catch (error) {
    console.error("❌ Erro ao atualizar Firestore:", error);
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
  const verificarVencedores = () => {
    if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) return; // 🔥 Se todos os prêmios já foram dados, sair imediatamente
  
    let vencedorQuadra = null;
    let vencedorQuina = null;
    let vencedorCartelaCheia = null;
  
    cartelas.forEach((cartela) => {
        if (quadraSaiu && quinaSaiu && cartelaCheiaSaiu) return; // Se já saiu tudo, não precisa continuar
  
        const linhas = [
            cartela.casas.slice(0, 5),
            cartela.casas.slice(5, 10),
            cartela.casas.slice(10, 15),
            cartela.casas.slice(15, 20),
            cartela.casas.slice(20, 25),
        ];

        linhas.forEach((linha) => {
            const marcadosNaLinha = linha.filter(num => cartela.marcados.includes(num)).length;

            if (!quadraSaiu && marcadosNaLinha === 4 && !vencedorQuadra) {
                vencedorQuadra = { userName: cartela.userName, tipo: "Quadra", cartelaId: cartela.idNumerico, userId: cartela.userId };
            }

            if (!quinaSaiu && marcadosNaLinha === 5 && !vencedorQuina) {
                vencedorQuina = { userName: cartela.userName, tipo: "Quina", cartelaId: cartela.idNumerico, userId: cartela.userId };
            }
        });

        if (!cartelaCheiaSaiu && cartela.marcados.length === 25 && !vencedorCartelaCheia) {
            vencedorCartelaCheia = { userName: cartela.userName, tipo: "Cartela Cheia", cartelaId: cartela.idNumerico, userId: cartela.userId };
        }
    });

    let novosVencedores = [];

    if (vencedorQuadra) {
        novosVencedores.push(vencedorQuadra);
        setQuadraSaiu(true);
    }

    if (vencedorQuina) {
        novosVencedores.push(vencedorQuina);
        setQuinaSaiu(true);
    }

    if (vencedorCartelaCheia) {
        novosVencedores.push(vencedorCartelaCheia);
        setCartelaCheiaSaiu(true);
    }

    if (novosVencedores.length > 0) {
        setVencedores((prevVencedores) => {
            const listaUnica = new Set([...prevVencedores.map(v => JSON.stringify(v)), ...novosVencedores.map(v => JSON.stringify(v))]);
            return [...listaUnica].map(v => JSON.parse(v));
        });



        

        salvarVitoriaUsuario(novosVencedores);
        
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
    let interval;
    if (sorteando) {
      interval = setInterval(() => {
        sortearNumero();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [sorteando, numerosSorteados]);

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
    if (vencedores.length === 0) return; // 🔥 Não salva se não houver vencedores
  
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
  
      console.log("✅ Sorteio finalizado salvo no Firebase:",sorteioIdGlobal );

      await resetarSorteio();
      await deletarTodasCartelas();
      await updateDoc(doc(db, "sorteio", "atual"), {
        liberado: false,
      });



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
            
            if (numerosSorteados.length >= sorteioData.quantidadeAcumulado) {
                ganhouAcumulado = true;
                valorAcumulado = sorteioData.acumulado || 0;
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
    alert("Sorteio resetado!");
  } catch (error) {
    console.error("❌ Erro ao resetar sorteio:", error);
    alert("Erro ao resetar sorteio. Verifique o console.");
  }
};
const deletarTodasCartelas = async () => {
  console.log("🧪 [DEBUG] deletarTodasCartelas foi chamada");

  try {
    const snapshot = await getDocs(collectionGroup(db, "userCartelas"));

    if (snapshot.empty) {
      console.log("📭 Nenhuma cartela encontrada na subcoleção 'userCartelas'.");
      return;
    }

    const deletarCartelas = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletarCartelas);

    console.log("🧹 Todas as cartelas da subcoleção 'userCartelas' foram deletadas!");
  } catch (error) {
    console.error("🔥 Erro ao deletar cartelas:", error);
  }
};




  

  console.log("✅ [Sorteio] Renderizando! Cartelas no contexto:", useContext(UserContext).cartelas);


  return (
    <div> 
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
