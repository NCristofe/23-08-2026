// ===== CONTADOR =====
const contador = document.getElementById("contador");
const dataInicio = new Date("2025-08-23T23:10:00");

function atualizarContador() {
  const agora = new Date();

  let anos = agora.getFullYear() - dataInicio.getFullYear();
  let meses = agora.getMonth() - dataInicio.getMonth();
  let dias = agora.getDate() - dataInicio.getDate();

  let horas = agora.getHours() - dataInicio.getHours();
  let minutos = agora.getMinutes() - dataInicio.getMinutes();
  let segundos = agora.getSeconds() - dataInicio.getSeconds();

  if (segundos < 0) { segundos += 60; minutos--; }
  if (minutos < 0) { minutos += 60; horas--; }
  if (horas < 0) { horas += 24; dias--; }

  if (dias < 0) {
    const ultimoMes = new Date(agora.getFullYear(), agora.getMonth(), 0);
    dias += ultimoMes.getDate();
    meses--;
  }

  if (meses < 0) {
    meses += 12;
    anos--;
  }

  contador.innerHTML = `
    <div>${anos} anos • ${meses} meses</div>
    <div class="tempo-grande">${dias} dias</div>
    <div>${horas}h ${minutos}m ${segundos}s</div>
  `;
}

setInterval(atualizarContador, 1000);
atualizarContador();


// ===== TOGGLE MENSAGENS (ABRIR/FECHAR) =====
const btnToggle = document.getElementById("toggleMensagens");
const painel = document.getElementById("painelMensagens");

btnToggle.onclick = () => {
  painel.classList.toggle("hidden");
};


// ===== MENSAGENS PRIVADAS =====
const listaMensagens = document.getElementById("listaMensagens");

document.getElementById("enviarMensagem").onclick = () => {
  const texto = document.getElementById("novaMensagem").value.trim();
  if (!texto) return;

  const msg = {
    texto,
    data: new Date().toLocaleString()
  };

  salvarMensagem(msg);
  renderMensagem(msg);

  document.getElementById("novaMensagem").value = "";
};

function salvarMensagem(msg) {
  let msgs = JSON.parse(localStorage.getItem("mensagens")) || [];
  msgs.push(msg);
  localStorage.setItem("mensagens", JSON.stringify(msgs));
}

function renderMensagem(msg) {
  const div = document.createElement("div");
  div.className = "msg";

  div.innerHTML = `
    <p>${msg.texto}</p>
    <small>${msg.data}</small>
  `;

  listaMensagens.prepend(div);
}

function carregarMensagens() {
  let msgs = JSON.parse(localStorage.getItem("mensagens")) || [];
  msgs.reverse().forEach(renderMensagem);
}


// ===== MURAL (SEPARADO) =====
const feed = document.getElementById("feedMemorias");

document.getElementById("salvarMemoria").onclick = () => {
  const texto = document.getElementById("textoMemoria").value.trim();
  const file = document.getElementById("imagemMemoria").files[0];

  if (!texto && !file) return;

  const reader = new FileReader();

  reader.onload = function () {
    const memoria = {
      texto,
      imagem: file ? reader.result : null,
      data: new Date().toLocaleString()
    };

    salvarMemoria(memoria);
    renderMemoria(memoria);
  };

  if (file) reader.readAsDataURL(file);
  else reader.onload();

  document.getElementById("textoMemoria").value = "";
  document.getElementById("imagemMemoria").value = "";
};

function salvarMemoria(memoria) {
  let mems = JSON.parse(localStorage.getItem("memorias")) || [];
  mems.push(memoria);
  localStorage.setItem("memorias", JSON.stringify(mems));
}

function renderMemoria(memoria) {
  const div = document.createElement("div");
  div.className = "memoria";

  div.innerHTML = `
    <p>${memoria.texto}</p>
    ${memoria.imagem ? `<img src="${memoria.imagem}">` : ""}
    <div class="data">${memoria.data}</div>
  `;

  feed.prepend(div);
}

function carregarMemorias() {
  let mems = JSON.parse(localStorage.getItem("memorias")) || [];
  mems.reverse().forEach(renderMemoria);
}


// ===== INIT =====
carregarMensagens();
carregarMemorias();
