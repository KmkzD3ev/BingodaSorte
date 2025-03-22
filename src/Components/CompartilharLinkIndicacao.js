import React, { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import {
  FacebookShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  TwitterShareButton,
} from "react-share";
import {
  FacebookIcon,
  WhatsappIcon,
  TelegramIcon,
  TwitterIcon,
} from "react-share";

const CompartilharLinkIndicacao = () => {
  const { uid } = useContext(UserContext);

  const link = `https://bingodasorte.tech/?ref=${uid}`;

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      background: "#fff",
      borderRadius: "10px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📲 Indique e Ganhe</h2>

      <p style={{ textAlign: "center", fontSize: "16px" }}>
        Copie e compartilhe o link abaixo com seus amigos. Ao se cadastrarem, você poderá ganhar bônus pelas recargas deles! 🎁
      </p>

      <div style={{
        background: "#f7f7f7",
        padding: "10px",
        borderRadius: "6px",
        marginTop: "15px",
        textAlign: "center",
        wordBreak: "break-all"
      }}>
        <strong>{link}</strong>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Compartilhe nas redes sociais:</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <WhatsappShareButton url={link} title="Jogue Bingo e Ganhe Prêmios! 🎉">
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>
          <FacebookShareButton url={link} quote="Participe do Bingo da Sorte e ganhe prêmios!">
            <FacebookIcon size={40} round />
          </FacebookShareButton>
          <TelegramShareButton url={link} title="Bora jogar Bingo da Sorte!">
            <TelegramIcon size={40} round />
          </TelegramShareButton>
          <TwitterShareButton url={link} title="Jogue Bingo e ganhe prêmios em dinheiro!">
            <TwitterIcon size={40} round />
          </TwitterShareButton>
        </div>
      </div>
    </div>
  );
};

export default CompartilharLinkIndicacao;
