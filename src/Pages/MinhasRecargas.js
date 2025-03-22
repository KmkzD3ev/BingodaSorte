import React, { useEffect, useState, useContext } from "react";
import { db } from "../services/firebaseconection";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { UserContext } from "../contexts/UserContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MinhasRecargas = () => {
  const { user } = useContext(UserContext);
  const [recargas, setRecargas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarRecargas = async () => {
      try {
        const recargasRef = collection(db, "depositos_pix");
        const q = query(
          recargasRef,
          where("userId", "==", user?.uid),
          orderBy("data", "desc")
        );

        const snapshot = await getDocs(q);
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRecargas(lista);
      } catch (err) {
        console.error("Erro ao buscar recargas:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      carregarRecargas();
    }
  }, [user]);

  if (loading) {
    return <div>Carregando recargas...</div>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Minhas Recargas</h2>
      {recargas.length === 0 ? (
        <p>Você ainda não fez nenhuma recarga via Pix.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recargas.map((recarga) => (
            <div
              key={recarga.id}
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
                <div style={{ fontSize: "0.9rem", color: "#666" }}>{recarga.metodo}</div>
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {format(new Date(recarga.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinhasRecargas;
