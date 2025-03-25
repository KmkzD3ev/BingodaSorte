import React, { useState, useContext,useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebaseconection";
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
  const [sorteioDisponivel, setSorteioDisponivel] = useState(false);
  const [liberadoRecentemente, setLiberadoRecentemente] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    const verificarSorteioDisponivel = async () => {
      try {
        const sorteiosRef = collection(db, "sorteios_agendados");
        const q = query(sorteiosRef, where("status", "==", "pendente"));
        const snapshot = await getDocs(q);
  
        if (snapshot.empty) {
          setSorteioDisponivel(false);
          return;
        }
  
        let sorteioLiberado = false;
  
        snapshot.forEach((doc) => {
          const data = doc.data();
          const [h, m] = data.hora.split(":").map(Number);
          const agora = new Date();
          const horarioSorteio = new Date();
          horarioSorteio.setHours(h, m, 0, 0);
  
          const diffMinutos = (agora - horarioSorteio) / 60000;
  
          if (diffMinutos >= 0 && diffMinutos <= 1) {
            sorteioLiberado = true;
          }
        });
  
        const agoraTimestamp = Date.now();
        const liberadoAte = parseInt(localStorage.getItem("liberadoAte") || "0", 10);
  
        // Só seta o localStorage se estiver liberado e não houver janela válida já aberta
        if (sorteioLiberado && agoraTimestamp > liberadoAte) {
          localStorage.setItem("liberadoAte", (agoraTimestamp + 60000).toString()); // janela de 1 minuto
          setLiberadoRecentemente(true);
          navigate("/PrincipalSorteio");
        }
  
        setSorteioDisponivel(sorteioLiberado);
      } catch (err) {
        console.error("🔥 Erro ao verificar sorteio:", err);
      }
    };
  
    verificarSorteioDisponivel();
    const interval = setInterval(verificarSorteioDisponivel, 5000);
    return () => clearInterval(interval);
  }, []);
  
  
  const formatSaldo = (saldo) => {
    return saldo === 0 ? "0,00" : saldo.toFixed(2).replace(".", ",");
  };


  useEffect(() => {
    const verificarLiberacaoLocal = () => {
      const liberadoAte = parseInt(localStorage.getItem("liberadoAte") || "0", 10);
      const agora = Date.now();
      setLiberadoRecentemente(agora <= liberadoAte);
    };
  
    verificarLiberacaoLocal();
    const interval = setInterval(verificarLiberacaoLocal, 1000); // checa a cada 1s
  
    return () => clearInterval(interval);
  }, []);
  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

 const handleAcessarSorteio = () => {
  if (!sorteioDisponivel && !liberadoRecentemente) {
    alert("⏳ O sorteio ainda não está disponível.");
    return;
  }

  navigate("/PrincipalSorteio");
  setIsOpen(false);
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
              <li
  onClick={handleAcessarSorteio}
  style={{
    opacity: (sorteioDisponivel || liberadoRecentemente) ? 1 : 0.5,
    cursor: (sorteioDisponivel || liberadoRecentemente) ? "pointer" : "not-allowed"
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
