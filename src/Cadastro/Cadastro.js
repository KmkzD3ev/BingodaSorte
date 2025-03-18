import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cadastro.css";
import { auth, db } from "../services/firebaseconection";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import bonusImage from "../assets/MSGbONUS.jpeg";
import img18 from "../assets/18+.jpeg";
import pixImage from "../assets/pix.jpeg";

const Cadastro = () => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    chavePix: "",
    idade: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Função para gerar um CPF aleatório (caso necessário)
  const gerarCPF = () => {
    return Math.floor(10000000000 + Math.random() * 90000000000).toString();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔹 Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      // 🔹 Criar documento no Firestore para armazenar os dados do usuário
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: formData.nome,
        email: formData.email,
        chavePix: formData.chavePix,
        idade: formData.idade,
        cpf: null, // 🔹 Gerando CPF automaticamente
        saldo: 0.00,
        depositoPix: [],
        saquePix: [],
        premios: []
      });

      // 🔹 Criar uma coleção separada para armazenar cartelas
      const cartelasCollectionRef = collection(db, "cartelas", user.uid, "userCartelas");
      await setDoc(doc(cartelasCollectionRef, "init"), {
        message: "Coleção de cartelas criada para este usuário"
      });

      alert("Usuário cadastrado com sucesso!");
      navigate("/home"); 
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="Geral">
      <div className="ImgPrime">
        <img src={bonusImage} alt="Bônus Especial" className="bonus-image" />
        <div className="container">
          <h1 className="title">BINGO da Sorte 2.0</h1>
          <div className="form-container">
            <p>Registre-se agora mesmo e concorra a milhares de prêmios.</p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="password" name="senha" placeholder="Senha" value={formData.senha} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="text" name="chavePix" placeholder="Chave Pix" value={formData.chavePix} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <input type="number" name="idade" placeholder="Idade" value={formData.idade} onChange={handleChange} required />
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Registrando..." : "REGISTRAR"}
              </button>

              <p className="login-link">
                Já tem uma conta? <a href="#" onClick={() => navigate("/Login")}>Faça login</a>
              </p>
            </form>

            <div className="images-section">
              <img src={img18} alt="18+" className="footer-image" />
              <img src={pixImage} alt="PIX" className="footer-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
