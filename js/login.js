const card = document.getElementById("card");
const loginBox = document.getElementById("loginBox");

let aberto = false;
let usuarioSelecionado = null;

// ===== ABRIR CARTA (MOBILE OK) =====
card.addEventListener("click", (e) => {

  if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;

  aberto = !aberto;

  if (aberto) {
    card.style.transform = "translateY(-80px)";
    loginBox.classList.remove("hidden");
  } else {
    card.style.transform = "translateY(0)";
    loginBox.classList.add("hidden");
  }
});


// ===== SELEÇÃO DE USUÁRIO =====
const botoes = document.querySelectorAll(".btn-user");

botoes.forEach(btn => {
  btn.addEventListener("click", () => {

    const nome = btn.dataset.user;

    // clicou no mesmo → desmarca
    if (usuarioSelecionado === nome) {
      usuarioSelecionado = null;
      btn.classList.remove("selected");
      return;
    }

    // remove seleção de todos
    botoes.forEach(b => b.classList.remove("selected"));

    // marca o atual
    btn.classList.add("selected");
    usuarioSelecionado = nome;
  });
});


// ===== LOGIN =====
function login() {
  const senha = document.getElementById("senha").value;

  const usuarios = {
    "Natanael Cristofe": "1234",
    "Geovanna Emanuela": "4321"
  };

  if (!usuarioSelecionado) {
    document.getElementById("erro").innerText = "Escolha um usuário";
    return;
  }

  if (senha === usuarios[usuarioSelecionado]) {
    localStorage.setItem("usuario", usuarioSelecionado);
    window.location.href = "index.html";
  } else {
    document.getElementById("erro").innerText = "Senha incorreta";
  }
}