import { useEffect, useContext } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../services/firebaseconection";
import { BingoContext } from "../contexts/BingoContext"; // 🔥 Envia o comando pelo Context API

const MonitorSorteios = () => {
  const { setIniciarSorteioExterno } = useContext(BingoContext);

  useEffect(() => {
    const verificarSorteios = async () => {
      try {
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, "0"); // Sempre 2 dígitos
        const minutosAtuais = agora.getMinutes().toString().padStart(2, "0"); // Sempre 2 dígitos
        const horaFormatada = `${horaAtual}:${minutosAtuais}`; // Exemplo: "19:50"

        console.log(`🕒 [Monitor] Hora atual: ${horaFormatada}`);

        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);

        let sorteioEncontrado = null;

        snapshot.forEach((doc) => {
          const dados = doc.data();
          
          // 🔍 Log detalhado para depuração
          console.log(`📌 Firestore: { hora: "${dados.hora}", status: "${dados.status}" }`);
          console.log(`📌 Comparando Firestore "${String(dados.hora).trim()}" com "${horaFormatada}"`);

          // 🔥 Comparação corrigida (removendo espaços e garantindo string)
          if (String(dados.hora).trim().replace(/\s/g, '') === horaFormatada) { 
            console.log("✅ Sorteio correspondente encontrado! Hora:", dados.hora);
            sorteioEncontrado = { id: doc.id, ...dados };
          }
        });

        if (sorteioEncontrado) {
          //alert(`🎉 Sorteio das ${sorteioEncontrado.hora} encontrado! Iniciando...`);
          iniciarSorteioAutomatico(sorteioEncontrado);
        } else {
          console.log("❌ Nenhum sorteio correspondente encontrado.");
        }
      } catch (error) {
        console.error("🔥 Erro ao verificar sorteios:", error);
      }
    };

    // 🔥 Verifica sorteios a cada 30 segundos
    verificarSorteios();
    const intervalo = setInterval(verificarSorteios, 30000);

    return () => clearInterval(intervalo);
  }, []);

  const iniciarSorteioAutomatico = async (sorteio) => {
    console.log(`🚀 Iniciando sorteio das ${sorteio.hora}...`);
    
    // 🔥 Envia um comando para `Sorteio.js` iniciar automaticamente
    setIniciarSorteioExterno(true);
    console.log("🔁 [Monitor] Comando enviado para iniciar o sorteio.");

    // 🔥 Atualiza Firestore para evitar repetição
    const sorteioRef = doc(db, "sorteios_agendados", sorteio.id);
    await updateDoc(sorteioRef, { status: "executado" });

    console.log(`✅ Sorteio das ${sorteio.hora} marcado como concluído.`);
  };

  return null; // ✅ Esse componente não renderiza nada, só monitora
};

export default MonitorSorteios;
