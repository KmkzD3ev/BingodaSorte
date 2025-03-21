import React, { useState } from "react";
import NavBar from "../Components/NavBar "
import Sorteio from "./Sorteio";
import PainelInfo from "../Components/PainelInfo";
import CartelasFaltantes from "../Cartelas/CartelasFaltantes";
import CardsSorteio from "../Components/CardsSorteio";
import "../Pages/PrincipalSorteio.css"
import Vencedores from "../Components/Vencedores";

const PrincipalSorteio = () => {
  const [vencedores, setVencedores] = useState([]);
  return (
    <div className="container-fluid principal-sorteio">
      {/* Navbar fixa no topo */}
      <div className="row">
        <div className="col-12">
          <NavBar className="navbar fixed-top" />
        </div>
      </div>

      {/* Adicionando margem para evitar sobreposição com a Navbar */}
      <div className="row mt-5 pt-4">
        <div className="col-12">
          {/* Sorteio ocupa 100% no mobile e é centralizado */}
          <Sorteio className="sorteio-painel w-100 d-flex justify-content-center" setVencedores={setVencedores} />
        </div>
      </div>

      {/* Garantindo espaçamento entre elementos */}
      <div className="row mt-3 d-flex flex-column align-items-center">
        <div className="col-12 col-md-6">
          <CardsSorteio className="cards-sorteio w-100 text-center" />
        </div>
      </div>

      {/* Painel Info e Cartelas organizados corretamente */}
      <div className="row mt-3">
        <div className="col-12">
        <PainelInfo mostrarCartelas={false}  />

        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
        <Vencedores vencedores={vencedores} />
         
        </div>
      </div>
    </div>
  );
};

export default PrincipalSorteio;
