import { useEffect, useContext } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../services/firebaseconection";
import { BingoContext } from "../contexts/BingoContext"; // 🔥 Envia o comando pelo Context API

const MonitorSorteios = () => {
  const { setSorteando, setIniciarSorteioExterno } = useContext(BingoContext);

  useEffect(() => {
    const verificarSorteios = async () => {
      try {
        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutosAtuais = agora.getMinutes();
        const horaFormatada = `${horaAtual}:${minutosAtuais < 10 ? "0" : ""}${minutosAtuais}`; // Exemplo: "18:25"

        console.log(`🕒 Hora atual: ${horaFormatada}`);

        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);

        let sorteioEncontrado = null;

        snapshot.forEach((doc) => {
          const dados = doc.data();
          if (dados.hora === horaFormatada) {
            sorteioEncontrado = { id: doc.id, ...dados };
          }
        });

        if (sorteioEncontrado) {
          console.log("🎉 Sorteio encontrado! Enviando comando para iniciar...");
          iniciarSorteioAutomatico(sorteioEncontrado);
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
    console.log(`✅ Iniciando sorteio das ${sorteio.hora}`);

    // 🔥 Envia um comando para `Sorteio.js` iniciar automaticamente
    setIniciarSorteioExterno(true);

    // 🔥 Atualiza Firestore para evitar repetição
    const sorteioRef = doc(db, "sorteios_agendados", sorteio.id);
    await updateDoc(sorteioRef, { status: "executado" });

    console.log(`✅ Sorteio das ${sorteio.hora} marcado como concluído.`);
  };

  return null; // ✅ Esse componente não renderiza nada, só monitora
};

export default MonitorSorteios;
