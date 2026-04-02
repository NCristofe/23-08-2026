// 🔐 LOGIN
const usuario = localStorage.getItem("usuario");

if (!usuario) {
  window.location.href = "login.html";
}

document.getElementById("usuarioLogado").innerText = "💖 " + usuario;

// LOGOUT
document.getElementById("logout").onclick = () => {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
};

// ⏱ CONTADOR COMPLETO
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
    <div style="font-size:2rem; font-weight:bold">${dias} dias</div>
    <div>${horas}h ${minutos}m ${segundos}s</div>
  `;
}

setInterval(atualizarContador, 1000);
atualizarContador();


// 💬 CHAT
const chat = document.getElementById("chat");

function enviarMensagem() {
  const input = document.getElementById("mensagemInput");
  const texto = input.value.trim();
  if (!texto) return;

  const msg = {
    texto,
    usuario,
    data: new Date().toLocaleString()
  };

  let msgs = JSON.parse(localStorage.getItem("chat")) || [];
  msgs.push(msg);
  localStorage.setItem("chat", JSON.stringify(msgs));

  render(msg);
  input.value = "";
}

function render(msg) {
  const div = document.createElement("div");
  div.className = "msg " + (msg.usuario === usuario ? "eu" : "outro");

  div.innerHTML = `
    <p>${msg.texto}</p>
    <small>${msg.usuario} • ${msg.data}</small>
  `;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function carregarMensagens() {
  let msgs = JSON.parse(localStorage.getItem("chat")) || [];
  msgs.forEach(render);
}

carregarMensagens();  