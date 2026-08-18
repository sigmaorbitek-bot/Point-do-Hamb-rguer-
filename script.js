
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
// ESTADO CARREGADO DO SUPABASE
// ==================================================

let horarioFuncionamento = {}; // preenchido a partir da tabela "horarios"
let modoLoja = "automatico"; // "automatico" | "aberta" | "fechada"

// ==================================================
// CARREGAR HORÁRIOS DO BANCO
// ==================================================

async function carregarHorarios() {
  const { data, error } = await supabaseClient.from("horarios").select("*");

  if (error) {
    console.error("Erro ao carregar horários:", error);
    return;
  }

  horarioFuncionamento = {};

  (data || []).forEach((registro) => {
    horarioFuncionamento[registro.dia_semana] = registro.aberto
      ? {
          abertura: registro.abertura?.slice(0, 5) || "00:00",
          fechamento: registro.fechamento?.slice(0, 5) || "00:00",
        }
      : null;
  });
}

// ==================================================
// CARREGAR MODO DA LOJA
// ==================================================

async function carregarModoLoja() {
  const { data, error } = await supabaseClient
    .from("configuracoes")
    .select("modo_loja")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar modo da loja:", error);
    return;
  }

  modoLoja = data?.modo_loja || "automatico";
}

// ==================================================
// VERIFICA SE A LOJA ESTÁ ABERTA
// ==================================================

function lojaEstaAberta() {
  if (modoLoja === "aberta") return true;
  if (modoLoja === "fechada") return false;

  // modo automático — segue os horários cadastrados
  const agora = new Date();
  const diaAtual = agora.getDay();
  const horarioHoje = horarioFuncionamento[diaAtual];

  if (!horarioHoje) return false;

  const horaAtual = agora.getHours().toString().padStart(2, "0");
  const minutoAtual = agora.getMinutes().toString().padStart(2, "0");
  const horarioAtual = `${horaAtual}:${minutoAtual}`;

  return (
    horarioAtual >= horarioHoje.abertura &&
    horarioAtual <= horarioHoje.fechamento
  );
}

// ==================================================
// ATUALIZA O STATUS NA TELA
// ==================================================

function atualizarStatusLoja() {
  const statusLoja = document.getElementById("status-loja");
  const statusIcone = document.getElementById("status-icone");
  const statusTexto = document.getElementById("status-texto");
  const statusHorario = document.getElementById("status-horario");
  const botaoDelivery = document.getElementById("btn-delivery");
  const botaoQuiosque = document.getElementById("btn-quiosque");

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

  // ==================================================
  // FECHADA MANUALMENTE (independente do horário)
  // ==================================================

  if (modoLoja === "fechada") {
    statusIcone.textContent = "🔴";
    statusTexto.textContent = "Loja fechada";
    statusHorario.textContent = "Fechada temporariamente pelo administrador";

    botaoDelivery.disabled = true;
    botaoQuiosque.disabled = true;
    return;
  }

  // ==================================================
  // ABERTA MANUALMENTE (independente do horário)
  // ==================================================

  if (modoLoja === "aberta") {
    statusIcone.textContent = "🟢";
    statusTexto.textContent = "Loja aberta";
    statusHorario.textContent = "Aberta agora";

    botaoDelivery.disabled = false;
    botaoQuiosque.disabled = false;
    return;
  }

  // ==================================================
  // MODO AUTOMÁTICO — segue os horários cadastrados
  // ==================================================

  const agora = new Date();
  const diaAtual = agora.getDay();
  const horarioHoje = horarioFuncionamento[diaAtual];

  if (!horarioHoje) {
    statusIcone.textContent = "🔴";
    statusTexto.textContent = "Loja fechada hoje";
    statusHorario.textContent = `Hoje é ${nomesDias[diaAtual]}`;

    botaoDelivery.disabled = true;
    botaoQuiosque.disabled = true;
    return;
  }

  if (lojaEstaAberta()) {
    statusIcone.textContent = "🟢";
    statusTexto.textContent = "Loja aberta";
    statusHorario.textContent = `Aberta até ${horarioHoje.fechamento}`;

    botaoDelivery.disabled = false;
    botaoQuiosque.disabled = false;
    return;
  }

  statusIcone.textContent = "🔴";
  statusTexto.textContent = "Loja fechada";
  statusHorario.textContent = `Hoje: ${horarioHoje.abertura} às ${horarioHoje.fechamento}`;

  botaoDelivery.disabled = true;
  botaoQuiosque.disabled = true;
}

// ==================================================
// ENTRAR NA LOJA
// ==================================================

function entrar(tipoPedido) {
  if (!lojaEstaAberta()) {
    atualizarStatusLoja();
    return;
  }

  if (tipoPedido !== "delivery" && tipoPedido !== "quiosque") {
    console.error("Tipo de pedido inválido:", tipoPedido);
    return;
  }

  localStorage.setItem("tipoPedido", tipoPedido);

  if (tipoPedido === "delivery") {
    window.location.href = "./delivery/index.html";
    return;
  }

  if (tipoPedido === "quiosque") {
    window.location.href = "./quiosque/index.html";
    return;
  }
}

// ==================================================
// CARREGA TUDO E ATUALIZA A TELA
// ==================================================

async function atualizarTudo() {
  await Promise.all([carregarHorarios(), carregarModoLoja()]);
  atualizarStatusLoja();
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  atualizarTudo();

  // reconsulta o Supabase a cada minuto — pega tanto a mudança
  // de horário quanto uma alteração manual feita no painel
  setInterval(atualizarTudo, 60000);
});
