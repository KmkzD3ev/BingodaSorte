import React, { useEffect, useState, useContext } from "react";
import { db } from "../services/firebaseconection";
import { doc, getDoc } from "firebase/firestore";
import { UserContext } from "../contexts/UserContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NavBar from "../Components/NavBar ";

const MinhasRecargas = () => {
  const { uid } = useContext(UserContext);
  const [recargas, setRecargas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📦 Componente MinhasRecargas renderizado");
    console.log("🆔 uid do contexto:", uid);

    const carregarRecargas = async () => {
      try {
        console.log("🔎 Buscando documento do usuário...");
        const userRef = doc(db, "usuarios", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log("✅ Documento do usuário encontrado");
          const data = userSnap.data();
          const lista = data.depositoPix || [];
          console.log("📄 Lista bruta de depositoPix:", lista);

          const normalizado = lista.map((item) => {
            if (typeof item === "number") {
              return {
                valor: item,
                metodo: "Pix",
                data: new Date().toISOString(),
              };
            }
            return item;
          });

          console.log("📊 Lista normalizada:", normalizado);
          setRecargas(normalizado.reverse());
        } else {
          console.warn("⚠️ Documento do usuário não existe!");
        }
      } catch (err) {
        console.error("❌ Erro ao buscar recargas:", err);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      carregarRecargas();
    } else {
      console.warn("⚠️ uid não disponível ainda.");
      setLoading(false);
    }
  }, [uid]);

  if (loading) return <div>Carregando recargas...</div>;

  return (
    <>
      <NavBar />
      <div style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Minhas Recargas</h2>
        {recargas.length === 0 ? (
          <p>Você ainda não fez nenhuma recarga via Pix.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recargas.map((recarga, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f0f4ff",
                  padding: "1rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.1rem" }}>+ R$ {Number(recarga.valor).toFixed(2)}</strong>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>{recarga.metodo || "Pix"}</div>
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  {recarga.data
                    ? format(new Date(recarga.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Data não disponível"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MinhasRecargas;
