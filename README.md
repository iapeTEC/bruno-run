# 🚀 Bruno Run - 3D Space Exploration Game (Android APK)

<p align="center">
  <img src="icon-512.png" width="220" alt="Bruno Run Icon - Mandalorian Starship" style="border-radius: 28px; box-shadow: 0 8px 30px rgba(0,229,255,0.4);" />
</p>

<p align="center">
  <b>Jogo de exploração e corrida espacial 3D em alta velocidade para Android!</b><br>
  Construído com Three.js e WebView acelerado por hardware para Android.
</p>

---

## 📲 Download do APK

👉 **[Clique aqui para baixar o APK direto (Última Versão)](https://github.com/iapeTEC/bruno-run/releases/latest/download/Bruno-Run.apk)**

<p align="center">
  <img src="qrcode-download.png" width="240" alt="QR Code - Download Bruno-Run.apk" style="border: 4px solid #00e5ff; border-radius: 16px; padding: 8px; background: white;" />
  <br>
  <i>Aponte a câmera do celular para baixar o APK direto!</i>
</p>

---

## 🪐 Novidades da Versão v1.1.0

- 🏜️ **Superfície Planetária**: Voe rasante sobre o cânion desértico alienígena com solo firme e sombra dinâmica sob a nave.
- ☀️ **Transição Dia / Noite com 3 Sóis**: Três sóis (um sol gigante central e dois pequenos companheiros ao redor) cruzam o horizonte criando um fade suave: **Manhã ➡️ Dia Pleno ➡️ Pôr do Sol Carmesim ➡️ Noite Estrelada ➡️ Madrugada**.
- 💎 **Obstáculos Estáticos no Solo**: As pirâmides e obeliscos de cristal estão fixos e ancorados no terreno, sem movimentos confusos e com espaçamento agradável para desviar.
- 📈 **Dificuldade Gradativa & Reset de Velocidade**:
  - A velocidade inicia calma e acelera gradualmente.
  - Ao atingir a pontuação e **desbloquear uma nova nave** (1.000 pts e 2.500 pts), **a velocidade reduz de volta ao cruzeiro**, permitindo respirar e dominar a nova nave antes de acelerar novamente!
- ⚡ **Planícies Livres (Áreas Seguras)**: Trechos abertos sem qualquer obstáculo para acionar o **Turbo de Plasma** com segurança.

> Caso você prefira baixar pelos artefatos da compilação do GitHub Actions, acesse a aba **Actions** no repositório.

---

## 📊 Banco de Dados & Ranking Oficial no Google Sheets

O jogo é integrado via **Google Apps Script** para salvar automaticamente os dados de cada partida:
- 📊 **[Acesse a Planilha do Google Sheets com o Ranking](https://docs.google.com/spreadsheets/d/1oRm3LtkGdlRF1EkGcl2h-UGfrV0MVi4LbM5mWkWl97M/edit)**
- 🌐 **[Página Web do Ranking Global](https://script.google.com/macros/s/AKfycbyUVrMaTqy2g70wuF_o8uB75JOvQOf1dxeJ4ovXnZjZdLV_64phNNhWho5yQ0iAsfn8/exec)**

---

## 🪐 Fases do Jogo (Incluindo a FASE CHEFÃO)

1. **🏎️ Fase 1: Podracer Vermelho do Anakin Skywalker (0 a 999 pontos)**
   - Voo rasante sobre a superfície desértica do planeta com solo firme e sombra dinâmica.
   - Três sóis (um sol gigante e dois companheiros) nascendo no horizonte em fade matinal suave.
   - Obstáculos: Pirâmides e obeliscos de cristal estáticos.

2. **🛡️ Fase 2: Razor Crest do Mandaloriano (1.000 a 2.499 pontos)**
   - Ao desbloquear a Razor Crest, a **velocidade reinicia** de volta ao cruzeiro para você se adaptar.
   - O planeta entra em pôr do sol carmesim com os 3 sóis se pondo no horizonte.

3. **🚀 Fase 3: N-1 Starfighter Modificada com Grogu (2.500 a 4.499 pontos)**
   - Velocidade reinicia de volta ao cruzeiro inicial com a nova nave veloz.
   - O planeta entra na noite estrelada.

4. **☄️ Fase 4: FASE CHEFÃO - ESPAÇO PROFUNDO & METEORITOS (4.500+ pontos)**
   - **Decolagem atmosférica**: O solo e os cânions desaparecem, entrando no vácuo do **Espaço Profundo** com estrelas cósmicas à distância!
   - Os obstáculos tornam-se **METEORITOS e ASTEROIDES 3D gigantescos e rochosos** flutuando no vácuo espacial.
   - A velocidade é reiniciada no início da Fase Chefão para fôlego inicial, acelerando gradativamente no desafio supremo de sobrevivência!
   - Há um botão na tela inicial para testar a **Fase Chefão** diretamente a qualquer momento!

---

## 🎮 Como Jogar

- **Pilote em 3D**: Toque e deslize o dedo na tela para movimentar a nave para todos os lados (cima, baixo, esquerda e direita). No teclado, use as setas ou W, A, S, D.
- **Desvie dos Cristais**: Existem cristais flutuantes pequenos, aglomerados pontiagudos e gigantescas **pirâmides de cristal** luminosas onde você precisa manobrar pelo vão entre elas.
- **Setores Livres (Espaços Vazios)**: Periodicamente, você entrará em zonas vazias do espaço sinalizadas no painel ("SETOR LIVRE"). É a oportunidade perfeita para ativar o turbo em segurança!
- **Jato de Plasma (Turbo Boost)**: Toque no botão **⚡ TURBO PLASMA** no canto inferior direito para ativar o propulsor de plasma. O campo de visão se alarga em efeito hiperespacial, a velocidade dobra e sua pontuação multiplica por 3x durante o turbo!
- **Dificuldade Crescente**: A velocidade do voo aumenta gradualmente conforme a pontuação sobe.
- **Colisão e Reinício**: Bater em qualquer obstáculo encerra a partida, salva seu recorde e permite reiniciar instantaneamente com um toque.

---

## 🛠️ Tecnologias Utilizadas

- **Renderização 3D**: Three.js WebGL com iluminação dinâmica, partículas e shaders otimizados para dispositivos móveis.
- **Áudio**: Web Audio API gerando sons de turbina, laser de plasma, impacto e fanfarras de desbloqueio em tempo real.
- **Android Runtime**: Android SDK 34, Hardware Acceleration ativada, Immersive Fullscreen Mode.
- **Automação CI/CD**: GitHub Actions com Gradle 8.5 gerando o APK e publicando a Release automaticamente.
