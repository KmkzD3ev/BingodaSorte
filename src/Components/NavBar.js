// NavBar.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseconection";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseconection";
import { UserContext } from "../contexts/UserContext";
import {
  Menu, X, LogOut, CreditCard, ShoppingCart, Gift, UserPlus, List, Clock, Wallet
} from "lucide-react";
import whatsappIcon from "../assets/whatsapp1.png";
import "./NavBar.css";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, saldo } = useContext(UserContext);
  const [sorteioLiberadoId, setSorteioLiberadoId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sorteios_agendados"), (snapshot) => {
      const agora = new Date();
      const pendentes = snapshot.docs.filter(doc => doc.data().status === "pendente");

      for (const doc of pendentes) {
        const data = doc.data();
        const [h, m] = (data.hora || "00:00").split(":").map(Number);
        const horario = new Date();
        horario.setHours(h, m, 0, 0);

        const diffMin = (agora - horario) / 60000;
        if (diffMin >= 0 && diffMin <= 1) {
          setSorteioLiberadoId(doc.id);
          navigate("/PrincipalSorteio");
          break;
        }
      }

      if (sorteioLiberadoId) {
        const liberadoAinda = snapshot.docs.find(doc => doc.id === sorteioLiberadoId && doc.data().status === "pendente");
        if (!liberadoAinda) {
          setSorteioLiberadoId(null);
        }
      }
    });

    return () => unsub();
  }, [sorteioLiberadoId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const handleAcessarSorteio = () => {
    if (!sorteioLiberadoId) {
      alert("⏳ Nenhum sorteio disponível agora.");
      return;
    }
    navigate("/PrincipalSorteio");
    setIsOpen(false);
  };

  const formatSaldo = (saldo) => saldo === 0 ? "0,00" : saldo.toFixed(2).replace(".", ",");

  return (
    <>
      <div className="navbar">
        <button onClick={() => setIsOpen(true)} className="menu-button">
          <Menu size={32} />
        </button>
        <h1 className="nav-title">BINGO DA SORTE</h1>
        <a href="https://wa.link/15idsn" target="_blank" rel="noopener noreferrer" className="whatsapp-icon">
          <img src={whatsappIcon} alt="WhatsApp" />
        </a>
      </div>

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
          <p className="saldo">R$ {formatSaldo(saldo)} <span>Meu Saldo</span></p>
        </div>

        <ul className="menu-list">
          <li onClick={() => { navigate("/home"); setIsOpen(false); }}>
            <ShoppingCart size={18} /> Home
          </li>
          <li onClick={() => { navigate("/Recarregar"); setIsOpen(false); }}>
            <Wallet size={18} /> Recarregar
          </li>
          <li
            onClick={handleAcessarSorteio}
            style={{
              opacity: sorteioLiberadoId ? 1 : 0.5,
              cursor: sorteioLiberadoId ? "pointer" : "not-allowed"
            }}
          >
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

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} /> Sair
        </button>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NavBar;
