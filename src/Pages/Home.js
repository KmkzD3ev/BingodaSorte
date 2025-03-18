import React from "react";
import NavBar from "../Components/NavBar "
import SorteioPainel from "../Components/SorteioPainel";
import CartelaCompra from "../Components/CartelaCompra";
import PainelInfo from "../Components/PainelInfo";
import "./Home.css"

function Home() {
  return (
    <div className="container-fluid">
      {/* Navbar sempre no topo */}
      <div className="row">
        <div className="col-12">
          <NavBar className="navbar" />
        </div>
      </div>

      {/* Painel do sorteio */}
      <div className="row mt-3">
        <div className="col-12">
          <SorteioPainel className="sorteio-painel" />
        </div>
      </div>

      {/* CartelaCompra logo abaixo do SorteioPainel */}
      <div className="row mt-3">
  <div className="col-12 order-2">
    <CartelaCompra />
  </div>
</div>

      {/* Painel de informações logo abaixo da CartelaCompra */}
      <div className="row mt-3">
        <div className="col-12">
        <PainelInfo className="painel-home" />

        </div>
      </div>

      {/* Espaço para as cartelas (Se existirem, você pode adicioná-las aqui depois) */}
      <div className="row mt-3">
        <div className="col-12">
          {/* Aqui é onde você pode renderizar as cartelas, caso tenha um componente para isso */}
        </div>
      </div>
    </div>
  );
}

export default Home; 