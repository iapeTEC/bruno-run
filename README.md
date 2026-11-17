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

👉 **[Clique aqui para baixar o APK direto (Releases)](https://github.com/iapeTEC/bruno-run/releases/download/v1.0.0/Bruno-Run.apk)**

> Caso você prefira baixar pelos artefatos da compilação do GitHub Actions, acesse a aba **Actions** no repositório.

---

## 🛸 Naves Desbloqueáveis por Pontuação

Conforme você voa mais longe e acumula pontos, novas naves lendárias são liberadas:

1. **🏎️ Podracer Vermelho do Anakin Skywalker (0 a 999 pontos)**
   - Moto de corrida estelar icônica com turbinas duplas frontais vermelhas e listras amarelas.
   - Arco de energia de plasma roxo unindo as turbinas e cabos de controle até a cabine traseira.

2. **🛡️ Razor Crest do Mandaloriano (1.000 a 2.499 pontos)**
   - Canhoneira blindada pesada em aço Beskar.
   - Motores cilíndricos duplos nas asas com rastro de combustão amarelo/laranja e canhões blaster frontais.

3. **🚀 N-1 Starfighter Modificada do Mandaloriano (2.500+ pontos)**
   - A nave mais recente do Mandaloriano: cromada e prateada com detalhes em amarelo.
   - Estabilizador pontiagudo afiado, motores de íons velozes ciano e a cúpula com o pequeno **Grogu** logo atrás da cabine!

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
