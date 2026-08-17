// ==================================================
// HORÁRIO DE FUNCIONAMENTO
// ==================================================

const horarioFuncionamento = {

  // Domingo
  0: null,

  // Segunda
  1: {
    abertura: "08:00",
    fechamento: "18:00",
  },

  // Terça
  2: {
    abertura: "08:00",
    fechamento: "18:00",
  },

  // Quarta
  3: {
    abertura: "08:00",
    fechamento: "18:00",
  },

  // Quinta
  4: {
    abertura: "08:00",
    fechamento: "18:00",
  },

  // Sexta
  5: {
    abertura: "08:00",
    fechamento: "18:00",
  },

  // Sábado
  6: {
    abertura: "08:00",
    fechamento: "13:00",
  },

};


// ==================================================
// NOMES DOS DIAS
// ==================================================

const nomesDias = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];


// ==================================================
// VERIFICA SE A LOJA ESTÁ ABERTA
// ==================================================

function lojaEstaAberta() {

  const agora = new Date();

  const diaAtual = agora.getDay();

  const horarioHoje =
    horarioFuncionamento[diaAtual];


  // Dia fechado
  if (!horarioHoje) {
    return false;
  }


  const horaAtual =
    agora
      .getHours()
      .toString()
      .padStart(2, "0");


  const minutoAtual =
    agora
      .getMinutes()
      .toString()
      .padStart(2, "0");


  const horarioAtual =
    `${horaAtual}:${minutoAtual}`;


  return (
    horarioAtual >= horarioHoje.abertura &&
    horarioAtual <= horarioHoje.fechamento
  );
}


// ==================================================
// ATUALIZA O STATUS NA TELA
// ==================================================

function atualizarStatusLoja() {

  const statusLoja =
    document.getElementById("status-loja");

  const statusIcone =
    document.getElementById("status-icone");

  const statusTexto =
    document.getElementById("status-texto");

  const statusHorario =
    document.getElementById("status-horario");


  // NOVOS BOTÕES
  const botaoDelivery =
    document.getElementById("btn-delivery");

  const botaoQuiosque =
    document.getElementById("btn-quiosque");


  // ==================================================
  // VERIFICA ELEMENTOS
  // ==================================================

  if (
    !statusLoja ||
    !statusIcone ||
    !statusTexto ||
    !statusHorario ||
    !botaoDelivery ||
    !botaoQuiosque
  ) {
    return;
  }


  const agora = new Date();

  const diaAtual =
    agora.getDay();

  const horarioHoje =
    horarioFuncionamento[diaAtual];


  // ==================================================
  // DIA FECHADO
  // ==================================================

  if (!horarioHoje) {

    statusIcone.textContent =
      "🔴";

    statusTexto.textContent =
      "Loja fechada hoje";

    statusHorario.textContent =
      `Hoje é ${nomesDias[diaAtual]}`;


    botaoDelivery.disabled =
      true;

    botaoQuiosque.disabled =
      true;


    return;
  }


  // ==================================================
  // LOJA ABERTA
  // ==================================================

  if (lojaEstaAberta()) {

    statusIcone.textContent =
      "🟢";

    statusTexto.textContent =
      "Loja aberta";

    statusHorario.textContent =
      `Aberta até ${horarioHoje.fechamento}`;


    botaoDelivery.disabled =
      false;

    botaoQuiosque.disabled =
      false;


    return;
  }


  // ==================================================
  // LOJA FECHADA
  // ==================================================

  statusIcone.textContent =
    "🔴";

  statusTexto.textContent =
    "Loja fechada";

  statusHorario.textContent =
    `Hoje: ${horarioHoje.abertura} às ${horarioHoje.fechamento}`;


  botaoDelivery.disabled =
    true;

  botaoQuiosque.disabled =
    true;
}


// ==================================================
// ENTRAR NA LOJA
// ==================================================

function entrar(tipoPedido) {

  // ==================================================
  // VERIFICA SE A LOJA ESTÁ ABERTA
  // ==================================================

  if (!lojaEstaAberta()) {

    atualizarStatusLoja();

    return;
  }


  // ==================================================
  // VERIFICA O TIPO DE PEDIDO
  // ==================================================

  if (
    tipoPedido !== "delivery" &&
    tipoPedido !== "quiosque"
  ) {

    console.error(
      "Tipo de pedido inválido:",
      tipoPedido
    );

    return;
  }


  // ==================================================
  // SALVA A ESCOLHA DO CLIENTE
  // ==================================================

  localStorage.setItem(
    "tipoPedido",
    tipoPedido
  );


  // ==================================================
  // DELIVERY
  // ==================================================

  if (tipoPedido === "delivery") {

    window.location.href =
      "./delivery/index.html";

    return;
  }


  // ==================================================
  // QUIOSQUE
  // ==================================================

  if (tipoPedido === "quiosque") {

    window.location.href =
      "./quiosque/index.html";

    return;
  }
}


// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    atualizarStatusLoja();


    // ==================================================
    // ATUALIZA O STATUS A CADA MINUTO
    // ==================================================

    setInterval(
      atualizarStatusLoja,
      60000
    );

  }
);