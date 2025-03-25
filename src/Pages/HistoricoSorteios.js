import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseconection";
import { collection, getDocs } from "firebase/firestore";
import NavBar from "../Components/NavBar ";
import CartelaCompraModal from "../Components/CartelaCompraModal";


const HistoricoSorteios = () => {
  const [sorteios, setSorteios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCompraAberto, setModalCompraAberto] = useState(false);

const [sorteioSelecionado, setSorteioSelecionado] = useState(null);


  useEffect(() => {
    const buscarSorteios = async () => {
      try {
        const finalizadosRef = collection(db, "Sorteios Finalizados");
        const finalizadosSnap = await getDocs(finalizadosRef);

        const agendadosRef = collection(db, "sorteios_agendados");
        const agendadosSnap = await getDocs(agendadosRef);

        const listaFinalizados = finalizadosSnap.docs
        .filter((doc) => Array.isArray(doc.data().vencedores) && doc.data().vencedores.length > 0)
        .map((doc) => {
          const data = doc.data();
          return {
            idSorteio: data.sorteioId || doc.id,
            dataFormatada: new Date(data.data).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            vencedores: data.vencedores,
            status: "finalizado",
          };
        });
      
        

        const listaAgendados = agendadosSnap.docs
        .filter((doc) => doc.data().status === "pendente")
        .map((doc) => {
          const data = doc.data();
          return {
            idSorteio: doc.id,
            dataFormatada: `Hoje às ${data.hora || "--:--"}`,
            vencedores: [],
            status: "pendente",
          };
        });
      

        // Junta as duas listas (agendados primeiro, ou troque a ordem se quiser)
        const todosSorteios = [...listaAgendados, ...listaFinalizados];
        setSorteios(todosSorteios);
      } catch (error) {
        console.error("🔥 Erro ao buscar sorteios:", error);
      }
      setLoading(false);
    };

    buscarSorteios();
  }, []);

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", fontWeight: "bold" }}>
          📜 Histórico de Sorteios
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>🔄 Carregando sorteios...</p>
        ) : sorteios.length === 0 ? (
          <p style={{ textAlign: "center" }}>⚠️ Nenhum sorteio encontrado.</p>
        ) : (
          <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "10px" }}>
            {sorteios.map((sorteio) => (
              <div key={sorteio.idSorteio} style={{ width: "80%", background: "#ffffff", border: "1px solid #ddd", borderRadius: "12px", boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)", padding: "20px", marginBottom: "20px", margin: "0 auto", position: "relative" }}>
                
                {/* Ícone de carrinho para sorteios pendentes */}
                                 
                    {sorteio.status === "pendente" && (
                  <span
                  style={{ position: "absolute", top: "15px", right: "15px", fontSize: "20px", color: "green", cursor: "pointer" }}
                  onClick={() => {
                    setSorteioSelecionado(sorteio.idSorteio);
                    setModalCompraAberto(true);
                  }}
                  
                  >
                  🛒
                       </span>
                   )}
                <h5 style={{ color: "#333", fontWeight: "bold" }}>🎟️ Sorteio: {sorteio.idSorteio}</h5>
                <p style={{ fontSize: "14px", color: "#666" }}>
                  📅 Data: <strong>{sorteio.dataFormatada}</strong>
                </p>
                <h6 style={{ marginTop: "15px" }}>🏆 Vencedores:</h6>
                <ul style={{ listStyle: "none", padding: "0", marginTop: "10px" }}>
                  {sorteio.vencedores.length > 0 ? (
                    sorteio.vencedores.map((vencedor, index) => (
                      <li key={index} style={{ background: "#f8f9fa", padding: "10px", borderLeft: "6px solid #007bff", marginBottom: "8px", borderRadius: "6px", fontSize: "15px" }}>
                        🏅 <strong style={{ color: "#007bff" }}>{vencedor.tipo}</strong> - Cartela: <strong>{vencedor.cartela}</strong> - Usuário:{" "}
                        <strong>{vencedor.usuario}</strong>
                      </li>
                    ))
                  ) : (
                    <li style={{ background: "#f8f9fa", padding: "10px", borderLeft: "6px solid #007bff", borderRadius: "6px", fontSize: "15px" }}>
                      {sorteio.status === "pendente" ? "⚠️ Sorteio ainda não realizado." : "Nenhum vencedor registrado."}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      {modalCompraAberto && (
  <CartelaCompraModal
    sorteioId={sorteioSelecionado}
    onClose={() => setModalCompraAberto(false)}
  />
)}




      
    </>
  );
};

export default HistoricoSorteios;
