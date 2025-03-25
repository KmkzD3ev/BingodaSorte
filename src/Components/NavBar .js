import React, { useState, useContext, useEffect } from "react";
import { collection, getDocs, query, where,doc,getDoc } from "firebase/firestore";
import { db } from "../services/firebaseconection";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, LogOut, CreditCard, ShoppingCart,
  Gift, UserPlus, List, Clock, Wallet
} from "lucide-react";
import "./NavBar.css";
import whatsappIcon from "../assets/whatsapp1.png";
import { auth } from "../services/firebaseconection";
import { signOut } from "firebase/auth";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, saldo } = useContext(UserContext);
  const navigate = useNavigate();
  const [sorteioIdMonitorado, setSorteioIdMonitorado] = useState(null);
  const [sorteioIniciado, setSorteioIniciado] = useState(null);



  useEffect(() => {
    const verificarSorteioDisponivel = async () => {
      try {
        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const [h, m] = data.hora.split(":" ).map(Number);
          const agora = new Date();
          const horarioSorteio = new Date();
          horarioSorteio.setHours(h, m, 0, 0);

          const diffMinutos = (agora - horarioSorteio) / 60000;

          if (diffMinutos >= 0 && diffMinutos <= 1) {
            console.log("🎯 Redirecionando para o sorteio automaticamente!");
            setSorteioIdMonitorado(doc.id);
            navigate("/PrincipalSorteio");
          }
        });
      } catch (err) {
        console.error("🔥 Erro ao verificar sorteio:", err);
      }
    };

    verificarSorteioDisponivel();
    const interval = setInterval(verificarSorteioDisponivel, 5000);
    return () => clearInterval(interval);
  }, [navigate]);
  useEffect(() => {
    if (!sorteioIdMonitorado) return;
  
    let iniciadoAnterior = null;
  
    const verificarIniciado = async () => {
      try {
        const docRef = doc(db, "sorteios_agendados", sorteioIdMonitorado);
        const docSnap = await getDoc(docRef);
  
        if (!docSnap.exists()) {
          console.warn("❌ Sorteio não encontrado.");
          return;
        }
  
        const data = docSnap.data();
        setSorteioIniciado(data.iniciado);
  
        if (data.iniciado !== iniciadoAnterior) {
          iniciadoAnterior = data.iniciado;
  
          toast.info(
            `📡 Sorteio ${sorteioIdMonitorado} ${data.iniciado ? "INICIADO" : "ENCERRADO"}`,
            { autoClose: 3000 }
          );
        }
      } catch (err) {
        console.error("❌ Erro ao monitorar sorteio:", err);
      }
    };
  
    verificarIniciado();
    const interval = setInterval(verificarIniciado, 60000); // A cada 1 minuto
    return () => clearInterval(interval);
  }, [sorteioIdMonitorado]);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleAcessarSorteio = () => {
    if (sorteioIniciado) {
      navigate("/PrincipalSorteio");
      setIsOpen(false);
    } else {
      alert("🚫 Sorteio indisponível no momento.");
      setIsOpen(false);
    }
  };
  
  const formatSaldo = (saldo) => {
    return saldo === 0 ? "0,00" : saldo.toFixed(2).replace(".", ",");
  };

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
          <p className="saldo">
            R$ {formatSaldo(saldo)} <span>Meu Saldo</span>
          </p>
        </div>

        <ul className="menu-list">
          <li onClick={() => { navigate("/home"); setIsOpen(false); }}>
            <ShoppingCart size={18} /> Home
          </li>
          <li onClick={() => { navigate("/Recarregar"); setIsOpen(false); }}>
            <Wallet size={18} /> Recarregar
          </li>
          <li onClick={handleAcessarSorteio}>
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
