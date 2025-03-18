import React, { useEffect, useState } from "react";
import { db } from "../services/firebaseconection";
import { collection, getDocs } from "firebase/firestore";
import NavBar from "../Components/NavBar ";

const HistoricoSorteios = () => {
  const [sorteios, setSorteios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarSorteios = async () => {
      try {
        const sorteiosRef = collection(db, "Sorteios Finalizados");
        const sorteiosSnapshot = await getDocs(sorteiosRef);

        if (sorteiosSnapshot.empty) {
          console.warn("⚠️ Nenhum sorteio encontrado.");
          setLoading(false);
          return;
        }

        const listaSorteios = sorteiosSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            idSorteio: data.idSorteio || "ID Desconhecido",
            dataFormatada: new Date(data.data).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            vencedores: Array.isArray(data.vencedores) ? data.vencedores : [],
          };
        });

        setSorteios(listaSorteios);
      } catch (error) {
        console.error("🔥 Erro ao buscar sorteios:", error);
      }
      setLoading(false);
    };

    buscarSorteios();
  }, []);

  return (
    <>
      {/* 🔥 Renderizando o NavBar */}
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
          <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "10px", scrollbarWidth: "thin", scrollbarColor: "#888 #f1f1f1" }}>
            {sorteios.map((sorteio) => (
              <div key={sorteio.idSorteio} style={{ width: "80%", background: "#ffffff", border: "1px solid #ddd", borderRadius: "12px", boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.1)", padding: "20px", marginBottom: "20px", transition: "transform 0.3s ease-in-out", margin: "0 auto" }}>
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
                      Nenhum vencedor registrado.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HistoricoSorteios;
