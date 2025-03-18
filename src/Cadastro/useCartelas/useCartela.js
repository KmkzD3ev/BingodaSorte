import { useContext } from "react";
import { db } from "../../services/firebaseconection";
import { collection, addDoc } from "firebase/firestore";
import { UserContext } from "../../contexts/UserContext";

const useCartela = () => {
  const { uid, setCartelas } = useContext(UserContext);

  const addCartela = async (cartelaData) => {
    if (!uid) {
      console.error("Erro: Usuário não autenticado!");
      return;
    }

    try {
      const cartelasCollectionRef = collection(db, "cartelas", uid, "userCartelas");

      // 🔹 Salva a cartela no Firestore
      const docRef = await addDoc(cartelasCollectionRef, cartelaData);
      console.log("Cartela adicionada com sucesso!", docRef.id);

      // 🔹 Atualiza o estado global das cartelas
      setCartelas((prevCartelas) => [...prevCartelas, cartelaData]);

    } catch (error) {
      console.error("Erro ao adicionar cartela:", error);
    }
  };

  return { addCartela };
};

export default useCartela;
