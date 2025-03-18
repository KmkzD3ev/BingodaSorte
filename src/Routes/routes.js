import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Cadastro from "../Cadastro/Cadastro";
import Home from "../Pages/Home";
import PrivateRoute from "./PrivateRoute";
import Sorteio from "../Pages/Sorteio";
import Login from "../Cadastro/Login";
import { UserProvider } from "../contexts/UserContext"; 
import { BingoProvider } from "../contexts/BingoContext"; // 🔹 Importando o contexto do Bingo
import PrincipalSorteio from "../Pages/PrincipalSorteio";
import HistoricoSorteios from "../Pages/HistoricoSorteios";
import MeusPremios from "../Pages/MeusPremios";
import CobrarPix from "../Pages/CobrarPix"

function AppRoutes() {
  return (
    <UserProvider> 
      <BingoProvider> {/* 🔹 Agora todos os componentes podem acessar o bingo */}
        <Router>
          <Routes>
            <Route path="/" element={<Cadastro />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/PrincipalSorteio" element={<PrincipalSorteio />} />
            <Route path="/Historico" element={<HistoricoSorteios />} />
            <Route path="/Premios" element={<MeusPremios />} />
            <Route path="/Recarregar" element={<CobrarPix />} />
          </Routes>
        </Router>
      </BingoProvider>
    </UserProvider>
  );
}

export default AppRoutes;
