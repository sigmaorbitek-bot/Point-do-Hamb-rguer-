// PAINEL ADMINISTRATIVO - POINT DO HAMBÚRGUER

// 1. CONFIGURAÇÃO SUPABASE

const SUPABASE_URL = "https://bhukrxwjfjpkkuejtqtv.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_ShiIeYHrnrjGKtdf1va9xw_1MRlYcKn";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

// 2. ELEMENTOS DO PAINEL

const totalProdutos = document.getElementById("total-produtos");
const totalPedidos = document.getElementById("total-pedidos");
const totalVendas = document.getElementById("total-vendas");
const ticketMedio = document.getElementById("ticket-medio");

const listaAdmin = document.getElementById("lista-admin");
const buscarAdmin = document.getElementById("buscar-admin");
const formProduto = document.getElementById("form-produto");
const msgCadastro = document.getElementById("msg-cadastro");

const listaPedidos = document.getElementById("lista-pedidos");
const filtroStatusPedido = document.getElementById("filtro-status-pedido");

// ELEMENTOS - CONFIGURAÇÃO DE DELIVERY

const formDelivery = document.getElementById("form-delivery");
const inputTaxa = document.getElementById("taxa");
const inputTempo = document.getElementById("tempo");
const msgDelivery = document.getElementById("msg-delivery");

// guarda o id da linha de configuração já existente no banco
let idConfiguracao = null;

// 3. FORMATAÇÃO

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
// 4. TESTAR SUPABASE
async function testarSupabase() {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("id, nome")
    .limit(5);

  if (error) {
    console.error("Erro ao conectar com Supabase:", error);
    return false;
  }

  console.log("Supabase conectado com sucesso!");
  console.log("Produtos:", data);

  return true;
}
// 5. CARREGAR PRODUTOS
async function carregarProdutos() {
  if (!listaAdmin) {
    return;
  }

  listaAdmin.innerHTML = `
    <p class="estado-admin">
      Carregando produtos...
    </p>
  `;

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao carregar produtos:", error);

    listaAdmin.innerHTML = `
      <p class="estado-admin">
        Erro ao carregar produtos.
      </p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    listaAdmin.innerHTML = `
      <p class="estado-admin">
        Nenhum produto cadastrado.
      </p>
    `;

    if (totalProdutos) {
      totalProdutos.textContent = "0";
    }

    return;
  }

  if (totalProdutos) {
    totalProdutos.textContent = data.length;
  }

  renderizarProdutos(data);
}

// 6. RENDERIZAR PRODUTOS

function renderizarProdutos(produtos) {
  if (!listaAdmin) {
    return;
  }

  listaAdmin.innerHTML = "";

  produtos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "card-admin";

    card.innerHTML = `
      ${
        produto.foto
          ? `
            <img
              src="${produto.foto}"
              alt="${produto.nome}"
            >
          `
          : ""
      }
      <div class="card-admin-conteudo">

        <h3>
          ${produto.nome || "Sem nome"}
        </h3>

        <p>
          ${produto.descricao || "Sem descrição"}
        </p>

        <p class="preco">
          ${formatarMoeda(produto.preco)}
        </p>

        <p>
          Estoque:
          ${produto.estoque ?? 0}
        </p>

        <p>
          Categoria:
          ${produto.categoria || "-"}
        </p>

        <p>
          Status:
          ${produto.ativo ? "Ativo" : "Inativo"}
        </p>

        <div class="card-admin-acoes">

          <button
            type="button"
            class="btn-editar"
            onclick="editarProduto(${produto.id})"
          >
            ✏️ Editar
          </button>

          <button
            type="button"
            class="btn-remover-produto"
            onclick="removerProduto(${produto.id})"
          >
            🗑️ Remover
          </button>

        </div>

      </div>
    `;

    listaAdmin.appendChild(card);
  });
}

// 7. CADASTRAR PRODUTO

if (formProduto) {
  formProduto.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (msgCadastro) {
      msgCadastro.textContent = "Cadastrando produto...";
    }

    const nome = document.getElementById("nome")?.value.trim();
    const preco = Number(document.getElementById("preco")?.value);
    const descricao = document.getElementById("descricao")?.value.trim();
    const estoque = Number(document.getElementById("estoque")?.value);
    const categoria = document.getElementById("categoria")?.value;

    // VALIDAÇÕES

    if (!nome) {
      msgCadastro.textContent = "Informe o nome do produto.";
      return;
    }

    if (Number.isNaN(preco) || preco < 0) {
      msgCadastro.textContent = "Informe um preço válido.";
      return;
    }

    if (Number.isNaN(estoque) || estoque < 0) {
      msgCadastro.textContent = "Informe um estoque válido.";
      return;
    }

    if (!categoria) {
      msgCadastro.textContent = "Selecione uma categoria.";
      return;
    }

    // INSERIR

    const inputFoto = document.getElementById("foto-produto");
    const arquivoFoto = inputFoto?.files?.[0];

    let urlFoto = null;

    if (arquivoFoto) {
      // VALIDAÇÃO DA FOTO

      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      const tamanhoMaximo = 5 * 1024 * 1024;

      if (!tiposPermitidos.includes(arquivoFoto.type)) {
        if (msgCadastro) {
          msgCadastro.textContent = "Formato inválido. Use JPG, PNG ou WEBP.";
        }
        return;
      }

      if (arquivoFoto.size > tamanhoMaximo) {
        if (msgCadastro) {
          msgCadastro.textContent = "A imagem deve ter no máximo 5 MB.";
        }
        return;
      }

      // NOME ÚNICO DO ARQUIVO

      const extensao = arquivoFoto.name.split(".").pop()?.toLowerCase();

      if (!extensao) {
        if (msgCadastro) {
          msgCadastro.textContent =
            "Não foi possível identificar a extensão da imagem.";
        }
        return;
      }

      const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;

      /*
       * O bucket já é "produtos".
       * O caminho do objeto será apenas: arquivo.png
       * e não: produtos/arquivo.png
       */

      const caminhoArquivo = nomeArquivo;

      // UPLOAD COM ATÉ 3 TENTATIVAS

      let erroUpload = null;

      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
          const resultadoUpload = await supabaseClient.storage
            .from("produtos")
            .upload(caminhoArquivo, arquivoFoto, {
              cacheControl: "3600",
              contentType: arquivoFoto.type,
              upsert: false,
            });

          erroUpload = resultadoUpload.error || null;

          if (!erroUpload) {
            console.log(`Foto enviada com sucesso na tentativa ${tentativa}.`);
            break;
          }

          console.warn(
            `Tentativa ${tentativa}/3 de upload falhou:`,
            erroUpload,
          );
        } catch (erro) {
          erroUpload = erro;
          console.warn(`Tentativa ${tentativa}/3 apresentou erro:`, erro);
        }

        if (tentativa < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * tentativa));
        }
      }

      // VERIFICAR ERRO DO UPLOAD

      if (erroUpload) {
        console.error("Erro definitivo ao enviar foto:", erroUpload);

        if (msgCadastro) {
          msgCadastro.textContent =
            "Não foi possível enviar a foto. Verifique sua conexão e o Storage do Supabase.";
        }
        return;
      }

      // PEGAR URL PÚBLICA

      const { data: dadosFoto } = supabaseClient.storage
        .from("produtos")
        .getPublicUrl(caminhoArquivo);

      if (!dadosFoto?.publicUrl) {
        console.error("Supabase não retornou a URL pública da imagem.");

        if (msgCadastro) {
          msgCadastro.textContent =
            "A foto foi enviada, mas não foi possível obter a URL.";
        }
        return;
      }

      urlFoto = dadosFoto.publicUrl;
      console.log("URL da foto:", urlFoto);
    }

    const { data, error } = await supabaseClient
      .from("produtos")
      .insert({
        nome: nome,
        preco: preco,
        descricao: descricao || null,
        estoque: estoque,
        categoria: categoria,
        foto: urlFoto,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao cadastrar produto:", error);
      msgCadastro.textContent = "Erro ao cadastrar produto.";
      return;
    }

    console.log("Produto cadastrado:", data);

    msgCadastro.textContent = "Produto cadastrado com sucesso!";

    formProduto.reset();

    await carregarProdutos();
    await atualizarResumo();
  });
}

// 8. BUSCAR PRODUTOS

if (buscarAdmin) {
  buscarAdmin.addEventListener("input", async function () {
    const termo = buscarAdmin.value.trim();

    if (!termo) {
      await carregarProdutos();
      return;
    }

    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .ilike("nome", `%${termo}%`)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro na busca:", error);
      return;
    }

    renderizarProdutos(data || []);
  });
}

// 9. REMOVER PRODUTO
async function removerProduto(id) {
  const confirmar = confirm("Deseja realmente remover este produto?");

  if (!confirmar) {
    return;
  }

  const { error } = await supabaseClient.from("produtos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao remover produto:", error);
    alert("Não foi possível remover o produto.");
    return;
  }

  alert("Produto removido com sucesso!");

  await carregarProdutos();
  await atualizarResumo();
}

// 10. EDITAR PRODUTO
async function editarProduto(id) {
  const { data: produto, error: erroBusca } = await supabaseClient
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBusca || !produto) {
    console.error("Erro ao buscar produto:", erroBusca);
    alert("Não foi possível carregar o produto.");
    return;
  }

  const novoNome = prompt("Nome do produto:", produto.nome || "");

  if (novoNome === null || !novoNome.trim()) {
    return;
  }

  const novoPreco = prompt("Preço:", produto.preco ?? "");

  if (novoPreco === null) {
    return;
  }

  const preco = Number(novoPreco.replace(",", "."));

  if (Number.isNaN(preco) || preco < 0) {
    alert("Preço inválido.");
    return;
  }

  const { error } = await supabaseClient
    .from("produtos")
    .update({
      nome: novoNome.trim(),
      preco: preco,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao editar produto:", error);
    alert("Erro ao editar produto.");
    return;
  }

  alert("Produto atualizado!");

  await carregarProdutos();
}

// 11. RESUMO DO PAINEL

async function atualizarResumo() {
  // PRODUTOS

  const { count: quantidadeProdutos, error: erroProdutos } =
    await supabaseClient.from("produtos").select("id", {
      count: "exact",
      head: true,
    });

  if (!erroProdutos && totalProdutos) {
    totalProdutos.textContent = quantidadeProdutos || 0;
  }

  // PEDIDOS

  const { data: pedidos, error: erroPedidos } = await supabaseClient
    .from("pedidos")
    .select("id, total");

  if (!erroPedidos && pedidos) {
    if (totalPedidos) {
      totalPedidos.textContent = pedidos.length;
    }

    const vendas = pedidos.reduce((total, pedido) => {
      return total + Number(pedido.total || 0);
    }, 0);

    if (totalVendas) {
      totalVendas.textContent = formatarMoeda(vendas);
    }

    if (ticketMedio) {
      const ticket = pedidos.length > 0 ? vendas / pedidos.length : 0;
      ticketMedio.textContent = formatarMoeda(ticket);
    }
  }
}

// 12. CARREGAR PEDIDOS

async function carregarPedidos(status = "todos") {
  if (!listaPedidos) {
    return;
  }

  listaPedidos.innerHTML = `
    <p class="estado-admin">
      Carregando pedidos...
    </p>
  `;

  let consulta = supabaseClient.from("pedidos").select("*").order("id", {
    ascending: false,
  });

  if (status !== "todos") {
    consulta = consulta.eq("status", status);
  }

  const { data, error } = await consulta;

  if (error) {
    console.error("Erro ao carregar pedidos:", error);

    listaPedidos.innerHTML = `
      <p class="estado-admin">
        Erro ao carregar pedidos.
      </p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    listaPedidos.innerHTML = `
      <p class="estado-admin">
        Nenhum pedido encontrado.
      </p>
    `;

    return;
  }

  listaPedidos.innerHTML = "";

  data.forEach((pedido) => {
    const card = document.createElement("article");
    card.className = "card-pedido";

    card.innerHTML = `

        <h3>
          Pedido #${pedido.id}
        </h3>

        <p>
          Cliente:
          ${pedido.nome_cliente || "-"}
        </p>

        <p>
          WhatsApp:
          ${pedido.telefone || "-"}
        </p>

        <p>
          Tipo:
          ${pedido.tipo_pedido || "-"}
        </p>

        ${
          pedido.mesa
            ? `
              <p>
                Mesa:
                ${pedido.mesa}
              </p>
            `
            : ""
        }

        ${
          pedido.endereco
            ? `
              <p>
                Endereço:
                ${pedido.endereco}
              </p>
            `
            : ""
        }

        <p>
          Forma de pagamento:
          ${pedido.forma_pagamento || "-"}
        </p>

        <p>
          Subtotal:
          ${formatarMoeda(pedido.subtotal)}
        </p>

        <p>
          Taxa de entrega:
          ${formatarMoeda(pedido.taxa_entrega)}
        </p>

        <p>
          Total:
          ${formatarMoeda(pedido.total)}
        </p>

        ${
          pedido.observacoes
            ? `
              <p>
                Observações:
                ${pedido.observacoes}
              </p>
            `
            : ""
        }

        <span class="status">
          ${pedido.status || "pendente"}
        </span>

      `;

    listaPedidos.appendChild(card);
  });
}
// 13. FILTRO DE PEDIDOS

if (filtroStatusPedido) {
  filtroStatusPedido.addEventListener("change", function () {
    carregarPedidos(filtroStatusPedido.value);
  });
}

// 14. CONFIGURAÇÃO DE DELIVERY (tabela "configuracoes")

async function carregarConfigDelivery() {
  if (!inputTaxa || !inputTempo) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("configuracoes")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar configuração de delivery:", error);
    return;
  }

  if (data) {
    // já existe uma linha de configuração — guarda o id pra usar no update
    idConfiguracao = data.id;
    inputTaxa.value = data.taxa_entrega;
    inputTempo.value = data.tempo_entrega || "";
  } else {
    // ainda não existe nenhuma configuração cadastrada
    idConfiguracao = null;
    inputTaxa.value = "";
    inputTempo.value = "";
  }
}

// ==========================================================
// ELEMENTOS - FUNCIONAMENTO DA LOJA
// ==========================================================

const modoLojaSelect = document.getElementById("modo-loja");
const textoStatusManual = document.getElementById("texto-status-manual");
const listaHorarios = document.getElementById("lista-horarios");
const btnSalvarHorarios = document.getElementById("btn-salvar-horarios");
const msgHorarios = document.getElementById("msg-horarios");

const DIAS_SEMANA = [
  { valor: 0, nome: "Domingo" },
  { valor: 1, nome: "Segunda-feira" },
  { valor: 2, nome: "Terça-feira" },
  { valor: 3, nome: "Quarta-feira" },
  { valor: 4, nome: "Quinta-feira" },
  { valor: 5, nome: "Sexta-feira" },
  { valor: 6, nome: "Sábado" },
];

// ==========================================================
// CARREGAR HORÁRIOS
// ==========================================================

async function carregarHorarios() {
  if (!listaHorarios) return;

  listaHorarios.innerHTML = '<p class="estado-admin">Carregando horários...</p>';

  const { data, error } = await supabaseClient
    .from("horarios")
    .select("*")
    .order("dia_semana", { ascending: true });

  if (error) {
    console.error("Erro ao carregar horários:", error);
    listaHorarios.innerHTML = '<p class="estado-admin">Erro ao carregar horários.</p>';
    return;
  }

  renderizarHorarios(data || []);
}

// ==========================================================
// RENDERIZAR HORÁRIOS (uma linha por dia da semana)
// ==========================================================

function renderizarHorarios(horarios) {
  listaHorarios.innerHTML = "";

  DIAS_SEMANA.forEach((dia) => {
    const registro = horarios.find((h) => h.dia_semana === dia.valor);

    const aberto = registro ? registro.aberto : true;
    const abertura = registro?.abertura?.slice(0, 5) || "18:00";
    const fechamento = registro?.fechamento?.slice(0, 5) || "23:00";

    const linha = document.createElement("div");
    linha.className = "horario-item";
    linha.dataset.dia = dia.valor;

    linha.innerHTML = `
      <span class="horario-dia">${dia.nome}</span>

      <label class="switch" title="Aberto neste dia">
        <input type="checkbox" class="horario-aberto" ${aberto ? "checked" : ""} />
        <span class="slider"></span>
      </label>

      <input type="time" class="horario-abertura" value="${abertura}" ${aberto ? "" : "disabled"} />
      <input type="time" class="horario-fechamento" value="${fechamento}" ${aberto ? "" : "disabled"} />
    `;

    listaHorarios.appendChild(linha);

    const checkbox = linha.querySelector(".horario-aberto");
    const inputAbertura = linha.querySelector(".horario-abertura");
    const inputFechamento = linha.querySelector(".horario-fechamento");

    checkbox.addEventListener("change", () => {
      inputAbertura.disabled = !checkbox.checked;
      inputFechamento.disabled = !checkbox.checked;
    });
  });
}

// ==========================================================
// SALVAR HORÁRIOS (as 7 linhas de uma vez, via upsert)
// ==========================================================

if (btnSalvarHorarios) {
  btnSalvarHorarios.addEventListener("click", async () => {
    const linhas = listaHorarios.querySelectorAll(".horario-item");

    const registros = Array.from(linhas).map((linha) => {
      const dia_semana = Number(linha.dataset.dia);
      const aberto = linha.querySelector(".horario-aberto").checked;
      const abertura = linha.querySelector(".horario-abertura").value;
      const fechamento = linha.querySelector(".horario-fechamento").value;

      return {
        dia_semana,
        aberto,
        abertura: aberto ? abertura : null,
        fechamento: aberto ? fechamento : null,
      };
    });

    if (msgHorarios) msgHorarios.textContent = "Salvando horários...";

    const { error } = await supabaseClient
      .from("horarios")
      .upsert(registros, { onConflict: "dia_semana" });

    if (error) {
      console.error("Erro ao salvar horários:", error);
      if (msgHorarios) msgHorarios.textContent = "Erro ao salvar horários.";
      return;
    }

    if (msgHorarios) msgHorarios.textContent = "Horários salvos com sucesso!";
  });
}

// ==========================================================
// MODO DA LOJA (automático / aberta manual / fechada manual)
// ==========================================================

async function carregarModoLoja() {
  if (!modoLojaSelect) return;

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

  const modo = data?.modo_loja || "automatico";
  modoLojaSelect.value = modo;
  atualizarTextoStatusManual(modo);
}

function atualizarTextoStatusManual(modo) {
  if (!textoStatusManual) return;

  if (modo === "aberta") {
    textoStatusManual.textContent = "🟢 Loja aberta manualmente";
  } else if (modo === "fechada") {
    textoStatusManual.textContent = "🔴 Loja fechada manualmente";
  } else {
    textoStatusManual.textContent = "🕒 Automático pelo horário";
  }
}

if (modoLojaSelect) {
  modoLojaSelect.addEventListener("change", async () => {
    const modo = modoLojaSelect.value;
    atualizarTextoStatusManual(modo);

    if (!idConfiguracao) {
      const { data, error } = await supabaseClient
        .from("configuracoes")
        .insert({ modo_loja: modo, taxa_entrega: 0, tempo_entrega: "" })
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar modo da loja:", error);
        return;
      }

      idConfiguracao = data.id;
      return;
    }

    const { error } = await supabaseClient
      .from("configuracoes")
      .update({ modo_loja: modo, atualizado_em: new Date().toISOString() })
      .eq("id", idConfiguracao);

    if (error) {
      console.error("Erro ao salvar modo da loja:", error);
    }
  });
}

if (formDelivery) {
  formDelivery.addEventListener("submit", async function (event) {
    event.preventDefault();

    const taxa = Number(inputTaxa.value);
    const tempo = inputTempo.value.trim();

    if (Number.isNaN(taxa) || taxa < 0) {
      if (msgDelivery) {
        msgDelivery.textContent = "Informe uma taxa válida.";
      }
      return;
    }

    if (!tempo) {
      if (msgDelivery) {
        msgDelivery.textContent = "Informe o tempo estimado de entrega.";
      }
      return;
    }

    if (msgDelivery) {
      msgDelivery.textContent = "Salvando...";
    }

    let erro = null;

    if (idConfiguracao) {
      // já existe uma linha — atualiza
      const resultado = await supabaseClient
        .from("configuracoes")
        .update({
          taxa_entrega: taxa,
          tempo_entrega: tempo,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", idConfiguracao);

      erro = resultado.error;
    } else {
      // ainda não existe nenhuma linha — cria a primeira
      const resultado = await supabaseClient
        .from("configuracoes")
        .insert({
          taxa_entrega: taxa,
          tempo_entrega: tempo,
        })
        .select()
        .single();

      erro = resultado.error;

      if (!erro && resultado.data) {
        idConfiguracao = resultado.data.id;
      }
    }

    if (erro) {
      console.error("Erro ao salvar configuração de delivery:", erro);

      if (msgDelivery) {
        msgDelivery.textContent = "Erro ao salvar configuração.";
      }
      return;
    }

    if (msgDelivery) {
      msgDelivery.textContent = "Configuração salva com sucesso!";
    }
  });
}
//  15. SAIR
function sair() {
  const confirmar = confirm("Deseja sair do painel?");

  if (!confirmar) {
    return;
  }

  window.location.href = "../../index.html";
}

// 16. EXPOR FUNÇÕES

window.removerProduto = removerProduto;
window.editarProduto = editarProduto;
window.sair = sair;

// 17. INICIALIZAÇÃO

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Painel administrativo iniciado.");

  const conectado = await testarSupabase();

  if (!conectado) {
    console.error("Painel não conseguiu conectar ao Supabase.");
    return;
  }

  await carregarProdutos();
  await carregarPedidos();
  await atualizarResumo();
  await carregarConfigDelivery();
  await carregarHorarios();
  await carregarModoLoja();
});
