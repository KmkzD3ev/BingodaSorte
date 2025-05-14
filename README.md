# 🎱 Bingo da Sorte — Sistema de Sorteios Online

Sistema completo de bingo interativo em tempo real, desenvolvido com **React + Firebase + integração backend**. Ideal para eventos online, sorteios automatizados e experiências gamificadas com transações reais como depósitos via Pix e requisições de saque.

---

## 📦 Funcionalidades Principais

### 🔁 Fluxo de Jogo Automatizado
- Início automático do sorteio ao preencher número mínimo de jogadores
- Sorteio automático com intervalo customizado
- Marcações automáticas de números nas cartelas dos jogadores
- Seleção e exibição automática dos vencedores com animação

### 🎯 Cartelas Interativas
- Geração e atribuição dinâmica de cartelas
- Marcações em tempo real conforme números sorteados
- Feedback visual dos acertos e status do jogo

### ☁️ Integração com Firebase (Realtime Database)
- Sincronização dos sorteios em tempo real
- Atualização ao vivo do estado do jogo, jogadores e cartelas
- Persistência dos dados da sala, usuários e status da partida

### 💸 Sistema de Transações Integradas
- **Depósitos via Pix** usando integração com backend via [backend-proxy](https://github.com/KmkzD3ev/backend-proxy)
- **Solicitação de saque** diretamente pela interface, com chamada ao mesmo backend
- Fluxo de autenticação e requisições com tokens

---

## 🧠 Arquitetura & Organização

