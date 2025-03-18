import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, CreditCard, ShoppingCart, Gift, UserPlus, List, Clock,Wallet } from "lucide-react"; 
import "./NavBar.css"; 
import whatsappIcon from "../assets/whatsapp1.png";
import { auth } from "../services/firebaseconection";
import { signOut } from "firebase/auth";
import { UserContext } from "../contexts/UserContext"; 

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, saldo } = useContext(UserContext);
  const navigate = useNavigate();

  const formatSaldo = (saldo) => {
    return saldo === 0 ? "0,00" : saldo.toFixed(2).replace(".", ",");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <>
      {/* Navbar principal */}
      <div className="navbar">
        <button onClick={() => setIsOpen(true)} className="menu-button">
          <Menu size={32} />
        </button>

        <h1 className="nav-title">BINGO DA SORTE</h1>

        <a href="https://wa.link/15idsn" target="_blank" rel="noopener noreferrer" className="whatsapp-icon">
          <img src={whatsappIcon} alt="WhatsApp" />
        </a>
      </div>

      {/* Menu Lateral */}
      <div className={`menu ${isOpen ? "menu-open" : ""}`}>
        <div className="menu-header">
          <button onClick={() => setIsOpen(false)} className="close-button">
            <X size={24} />
          </button>
          <div className="profile-section">
            <img src="/profile-placeholder.png" alt="Perfil" className="profile-pic" />
            <div>
              <p className="profile-name">{user || "Carregando..."}</p>
            </div>
          </div>
          <p className="saldo">
            R$ {formatSaldo(saldo)} <span>Meu Saldo</span>
          </p>
        </div>

        {/* Itens do Menu com Navegação */}
        <ul className="menu-list">
          <li onClick={() => { navigate("/home"); setIsOpen(false); }}>
            <ShoppingCart size={18} /> Home
          </li>
          <li onClick={() => { navigate("/Recarregar"); setIsOpen(false); }}>
             <Wallet size={18} /> Recarregar
              </li>

          <li onClick={() => { navigate("/PrincipalSorteio"); setIsOpen(false); }}>
            <List size={18} /> Sorteio
          </li>
          <li onClick={() => { navigate("/Historico"); setIsOpen(false); }}>
            <Clock size={18} /> Histórico de Sorteios
          </li>
          <li onClick={() => { navigate("/Premios"); setIsOpen(false); }}>
            <Gift size={18} /> Meus Prêmios
          </li>
          <li onClick={() => { navigate("/MinhasRecargas"); setIsOpen(false); }}>
            <CreditCard size={18} /> Minhas Recargas
          </li>
          <li onClick={() => { navigate("/IndicarAmigo"); setIsOpen(false); }}>
            <UserPlus size={18} /> Indicar Amigo
          </li>
        </ul>

        {/* Botão de Logout */}
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} /> Sair
        </button>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavBar;
