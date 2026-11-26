// Participantes, na ordem em que vão sortear
const PARTICIPANTES = ["Maria Luiza", "Bruna", "Ranny", "Mariah"];

const $ = (id) => document.getElementById(id);
const TELAS = ["tela-carregando", "tela-erro", "tela-vez", "tela-resultado", "tela-fim"];
const CHAVE_LOCAL = "amigo-secreto-meu-resultado"; // guardado só neste celular

function mostrar(tela) {
  TELAS.forEach((id) => { $(id).hidden = id !== tela; });
}

function erro(msg) {
  $("msg-erro").textContent = msg;
  mostrar("tela-erro");
}

if (typeof firebase === "undefined") {
  erro("Não foi possível carregar o Firebase. Verifique a internet.");
} else if (FIREBASE_CONFIG.apiKey === "COLE_AQUI") {
  erro("Falta configurar o Firebase. Siga o passo a passo do LEIAME.md.");
} else {
  iniciar();
}

function iniciar() {
  firebase.initializeApp(FIREBASE_CONFIG);
  const ref = firebase.database().ref("amigo-secreto/sorteios");

  let sorteios = {};      // { quemSorteou: quemFoiSorteado } (compartilhado)
  let vendoResultado = false;

  const meuResultado = () => {
    try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL)); } catch (e) { return null; }
  };

  const quemEstaNaVez = () => PARTICIPANTES.find((p) => !(p in sorteios));

  function render() {
    if (vendoResultado) return;
    const vez = quemEstaNaVez();
    const meu = meuResultado();
    const podeRever = !!meu;

    if (!vez) {
      $("btn-rever-fim").hidden = !podeRever;
      mostrar("tela-fim");
      return;
    }
    $("nome-vez").textContent = vez;
    $("progresso").textContent =
      `${Object.keys(sorteios).length} de ${PARTICIPANTES.length} já sortearam`;
    $("btn-rever").hidden = !podeRever;
    mostrar("tela-vez");
  }

  function exibirResultado(quem, alvo) {
    vendoResultado = true;
    $("quem-sorteou").textContent = quem;
    $("nome-sorteado").textContent = alvo;
    mostrar("tela-resultado");
  }

  // Sorteio feito como transação: só uma pessoa por vez, sem conflito entre celulares
  async function sortear() {
    const vez = quemEstaNaVez();
    if (!vez) return;
    $("btn-sortear").disabled = true;

    try {
      const res = await ref.transaction((atual) => {
        atual = atual || {};
        if (atual[vez]) return; // alguém já sorteou por ela: cancela

        const ja = Object.values(atual);
        let candidatos = PARTICIPANTES.filter((p) => p !== vez && !ja.includes(p));

        // Evita que a última pessoa fique só com ela mesma
        const givers = PARTICIPANTES.filter((p) => p !== vez && !(p in atual));
        const receivers = PARTICIPANTES.filter((p) => !ja.includes(p));
        if (givers.length === 1) {
          const g = givers[0];
          candidatos = candidatos.filter((c) => {
            const sobra = receivers.filter((r) => r !== c);
            return !(sobra.length === 1 && sobra[0] === g);
          });
        }
        if (!candidatos.length) return;

        const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
        return { ...atual, [vez]: escolhido };
      });

      if (!res.committed) {
        alert("Esse sorteio já foi feito. Atualize a página.");
        return;
      }
      const alvo = res.snapshot.val()[vez];
      try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ quem: vez, alvo })); } catch (e) {}
      exibirResultado(vez, alvo);
    } catch (e) {
      alert("Erro ao sortear. Verifique a internet e tente de novo.");
    } finally {
      $("btn-sortear").disabled = false;
    }
  }

  function rever() {
    const meu = meuResultado();
    if (meu) exibirResultado(meu.quem, meu.alvo);
  }

  $("btn-sortear").addEventListener("click", sortear);
  $("btn-rever").addEventListener("click", rever);
  $("btn-rever-fim").addEventListener("click", rever);
  $("btn-fechar").addEventListener("click", () => {
    vendoResultado = false;
    render();
  });

  // Botão de reiniciar só aparece com ?admin=1 no endereço
  if (new URLSearchParams(location.search).get("admin") === "1") {
    $("btn-reset").hidden = false;
    $("btn-reset").addEventListener("click", async () => {
      if (!confirm("Isso apaga TODOS os sorteios. Tem certeza?")) return;
      await ref.remove();
      try { localStorage.removeItem(CHAVE_LOCAL); } catch (e) {}
    });
  }

  ref.on("value", (snap) => {
    sorteios = snap.val() || {};
    // se o sorteio foi reiniciado, limpa o resultado guardado neste celular
    if (Object.keys(sorteios).length === 0) {
      try { localStorage.removeItem(CHAVE_LOCAL); } catch (e) {}
    }
    render();
  }, () => erro("Sem permissão no banco. Confira as regras no LEIAME.md."));
}
