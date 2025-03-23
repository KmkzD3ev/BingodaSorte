// Cadastro.js
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
    tipoPix: "cpf",
    idade: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "chavePix" && formData.tipoPix === "phone") {
      if (!newValue.startsWith("+55")) {
        newValue = "+55" + newValue.replace(/^\+?55/, "");
      }
    }

    setFormData({ ...formData, [name]: newValue });
  };

  const handleTipoPixChange = (e) => {
    const tipo = e.target.value;
    let chave = formData.chavePix;
    if (tipo === "phone" && !chave.startsWith("+55")) {
      chave = "+55" + chave.replace(/^\+?55/, "");
    }
    setFormData({ ...formData, tipoPix: tipo, chavePix: chave });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;
      const refUid = new URLSearchParams(window.location.search).get("ref");

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: formData.nome,
        email: formData.email,
        chavePix: formData.chavePix,
        tipoPix: formData.tipoPix,
        idade: formData.idade,
        cpf: null,
        saldo: 0.00,
        depositoPix: [],
        saquePix: [],
        premios: [],
        indicador: refUid || null,
      });

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
                <select name="tipoPix" value={formData.tipoPix} onChange={handleTipoPixChange} required style={{ fontSize: '14px', padding: '5px' }}>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="token">Chave Aleatória</option>
                </select>
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
