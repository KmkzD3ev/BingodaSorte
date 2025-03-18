import React from "react";
import RecargaPix from "../Components/RecargaPix"; // Importando RecargaPix

const CobrarPix = () => {
  return (
    <div style={styles.container}>
      <h1>Cobrança via Pix</h1>
      <RecargaPix /> {/* Chamando o componente filho */}
    </div>
  );
};

// 🔹 Estilos básicos inline (opcional)
const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    textAlign: "center",
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
};

export default CobrarPix;
