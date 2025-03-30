// src/hooks/useSorteioId.js
import { useState, useEffect } from "react";

export const useSorteioId = () => {
  const [id, setId] = useState(() => localStorage.getItem("idSorteioAgendado"));

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "idSorteioAgendado") {
        setId(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const atualizarId = (novoId) => {
    localStorage.setItem("idSorteioAgendado", novoId);
    setId(novoId);
  };

  return [id, atualizarId];
};
