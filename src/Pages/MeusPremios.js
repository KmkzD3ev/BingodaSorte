import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebaseconection";
import { doc, getDoc } from "firebase/firestore";
import NavBar from "../Components/NavBar ";

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

  const handleSacar = (premio) => {
    console.log("Sacar prêmio:", premio);
    // Implemente a lógica de saque aqui
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
