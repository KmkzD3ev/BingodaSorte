import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cadastro.css";
import { auth } from "../services/firebaseconection";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import bonusImage from "../assets/MSGbONUS.jpeg"; // Imagem de bônus
import whatsappIcon from "../assets/whatsapp1.png";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Para redirecionar após login

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.senha);
      alert("Login realizado com sucesso!");
      navigate("/home"); // Redireciona para a Home após login
    } catch (err) {
      setError("E-mail ou senha incorretos.");
    }

    setLoading(false);
  };

  // 🔥 Função para recuperar senha
  const recuperarSenha = async () => {
    if (!formData.email) {
      alert("⚠️ Por favor, insira seu e-mail antes de recuperar a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      alert("📩 Um e-mail para redefinir sua senha foi enviado!");
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error.message);
      alert("⚠️ Erro ao recuperar senha. Verifique o e-mail inserido.");
    }
  };

  return (
    <div className="Geral">
      <div className="ImgPrime">
        <img src={bonusImage} alt="Bônus Especial" className="bonus-image" />

        <div className="container">
          <h1 className="title">BINGO da Sorte 2.0</h1>
          <div className="form-container">
            <p>Faça login para acessar sua conta e jogar!</p>

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  name="senha"
                  placeholder="Senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? "Entrando..." : "ENTRAR"}
              </button>

              {/* 🔥 Ao clicar aqui, chama a função de recuperação de senha */}
              <button type="button" onClick={recuperarSenha} className="recover-access">
                ESQUECI MINHA SENHA
              </button>
            </form>
          </div>
          {/* 🔥 WhatsApp Fixo no Canto Inferior Direito com Texto */}
<div style={{ position: "fixed", bottom: "80px", right: "20px", textAlign: "center", zIndex: 1000 }}>
  {/* 🔥 Texto de suporte acima do botão */}
  <span style={{
    backgroundColor: "rgba(0, 0, 0, 0.7)", // 🔹 Fundo escuro semi-transparente
    color: "white",
    padding: "5px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
    marginBottom: "5px",
    maxWidth: "120px"
  }}>
    Precisa de ajuda? <br/> Chame o suporte!
  </span>

  {/* 🔥 Botão do WhatsApp */}
  <a
    href="https://wa.link/15idsn"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      width: "50px",
      height: "50px",
      backgroundColor: "#25D366",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    }}
  >
    <img
      src={whatsappIcon}
      alt="WhatsApp"
      style={{
        width: "30px",
        height: "30px"
      }}
    />
  </a>
</div>

        </div>
      </div>
    </div>
  );
};

export default Login;
