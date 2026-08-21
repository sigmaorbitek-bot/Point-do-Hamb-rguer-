// PAINEL ADMINISTRATIVO - POINT DO HAMBÚRGUER

// ==========================================================
// 1. ELEMENTOS DO PAINEL
// ==========================================================

const totalProdutos = document.getElementById("total-produtos");
const totalPedidos = document.getElementById("total-pedidos");
const totalVendas = document.getElementById("total-vendas");
const ticketMedio = document.getElementById("ticket-medio");

const listaAdmin = document.getElementById("lista-admin");
const buscarAdmin = document.getElementById("buscar-admin");
const formProduto = document.getElementById("form-produto");
const msgCadastro = document.getElementById("msg-cadastro");
const btnSubmitProduto = formProduto?.querySelector('button[type="submit"]');
const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");

const listaPedidos = document.getElementById("lista-pedidos");
const filtroStatusPedido = document.getElementById("filtro-status-pedido");
const btnApagarProntos = document.getElementById("btn-apagar-prontos");

// ELEMENTOS - CONFIGURAÇÃO DE DELIVERY

const formDelivery = document.getElementById("form-delivery");
const inputTaxa = document.getElementById("taxa");
const inputTempo = document.getElementById("tempo");
const msgDelivery = document.getElementById("msg-delivery");

// ELEMENTOS - CONFIGURAÇÃO DO QUIOSQUE (MESAS)

const formQuiosque = document.getElementById("form-quiosque");
const inputQuantidadeMesas = document.getElementById("quantidade-mesas");
const msgQuiosque = document.getElementById("msg-quiosque");

// ELEMENTOS - FUNCIONAMENTO DA LOJA

const modoLojaSelect = document.getElementById("modo-loja");
const textoStatusManual = document.getElementById("texto-status-manual");
const listaHorarios = document.getElementById("lista-horarios");
const btnSalvarHorarios = document.getElementById("btn-salvar-horarios");
const msgHorarios = document.getElementById("msg-horarios");

// ELEMENTOS - RELATÓRIOS

const selectRelatorioPeriodo = document.getElementById("relatorio-periodo");
const btnAtualizarRelatorio = document.getElementById("btn-atualizar-relatorio");
const btnImprimirRelatorio = document.getElementById("btn-imprimir-relatorio");

const relatorioTotalVendas = document.getElementById("relatorio-total-vendas");
const relatorioTotalPedidos = document.getElementById("relatorio-total-pedidos");
const relatorioTicketMedio = document.getElementById("relatorio-ticket-medio");
const relatorioProdutosVendidos = document.getElementById("relatorio-produtos-vendidos");
const tabelaRelatorio = document.getElementById("tabela-relatorio");

const areaImpressao = document.getElementById("area-impressao");

// guarda o id da linha de configuração já existente no banco
let idConfiguracao = null;

// guarda o id do produto em edição (null = formulário está em modo "cadastrar")
let produtoEditandoId = null;

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
// 2. FORMATAÇÃO
// ==========================================================

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// FORMATA TELEFONE PARA EXIBIÇÃO: (81) 95566-6335
function formatarTelefoneExibicao(telefone) {
  let digitos = (telefone || "").replace(/\D/g, "");

  // remove o 55 do DDI se vier na frente
  if (digitos.length > 11 && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return telefone || "-";
}

// FORMATA O NÚMERO DA MESA COM ZERO À ESQUERDA: 02
function formatarMesa(mesa) {
  const numero = Number(mesa);
  return Number.isNaN(numero) ? mesa : String(numero).padStart(2, "0");
}

// FORMATA TELEFONE PARA O LINK DO WHATSAPP (com DDI 55)
function formatarNumeroWhatsApp(telefone) {
  let digitos = (telefone || "").replace(/\D/g, "");
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;
  return `55${digitos}`;
}

// MONTA A MENSAGEM CONFORME O TIPO DO PEDIDO
function montarMensagemConfirmacao(pedido) {
  if (pedido.tipo_pedido === "quiosque") {
    return `Olá, ${pedido.nome_cliente}! Seu pedido #${pedido.id} está pronto e já vai para a mesa ${formatarMesa(pedido.mesa)}. 🍔`;
  }
  return `Olá, ${pedido.nome_cliente}! Muito obrigado pela preferência 🙏🏻 Seu pedido #${pedido.id} está a caminho! 🛵`;
}

// ==========================================================
// 3. TESTAR SUPABASE
// ==========================================================

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

// ==========================================================
// 4. CARREGAR PRODUTOS
// ==========================================================

async function carregarProdutos() {
  if (!listaAdmin) {
    return;
  }

  listaAdmin.innerHTML = `<p class="estado-admin">Carregando produtos...</p>`;

  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    listaAdmin.innerHTML = `<p class="estado-admin">Erro ao carregar produtos.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaAdmin.innerHTML = `<p class="estado-admin">Nenhum produto cadastrado.</p>`;
    if (totalProdutos) totalProdutos.textContent = "0";
    return;
  }

  if (totalProdutos) totalProdutos.textContent = data.length;

  renderizarProdutos(data);
}

// ==========================================================
// 5. RENDERIZAR PRODUTOS
// ==========================================================
// Trocado de innerHTML com template string para createElement/textContent.
// nome/descricao/categoria vêm do banco, cadastrados pelo próprio painel,
// então o risco aqui é baixo — mas manter o mesmo padrão em todo o app
// evita que alguém copie este trecho como "modelo" pra outra tela que
// recebe dado de cliente (como a de pedidos, corrigida abaixo).

function renderizarProdutos(produtos) {
  if (!listaAdmin) return;

  listaAdmin.innerHTML = "";

  produtos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "card-admin";

    if (produto.foto) {
      const img = document.createElement("img");
      img.src = produto.foto;
      img.alt = produto.nome || "Produto";
      card.appendChild(img);
    }

    const conteudo = document.createElement("div");
    conteudo.className = "card-admin-conteudo";

    const nome = document.createElement("h3");
    nome.textContent = produto.nome || "Sem nome";

    const descricao = document.createElement("p");
    descricao.textContent = produto.descricao || "Sem descrição";

    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = formatarMoeda(produto.preco);

    const estoque = document.createElement("p");
    estoque.textContent = `Estoque: ${produto.estoque ?? 0}`;

    const categoria = document.createElement("p");
    categoria.textContent = `Categoria: ${produto.categoria || "-"}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${produto.ativo ? "Ativo" : "Inativo"}`;

    const acoes = document.createElement("div");
    acoes.className = "card-admin-acoes";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn-editar";
    btnEditar.textContent = "✏️ Editar";
    btnEditar.addEventListener("click", () => editarProduto(produto.id));

    const btnToggleAtivo = document.createElement("button");
    btnToggleAtivo.type = "button";
    btnToggleAtivo.className = produto.ativo
      ? "btn-desativar-produto"
      : "btn-ativar-produto";
    btnToggleAtivo.textContent = produto.ativo ? "🚫 Desativar" : "✅ Ativar";
    btnToggleAtivo.addEventListener("click", () =>
      alternarAtivoProduto(produto.id, produto.ativo),
    );

    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "btn-remover-produto";
    btnRemover.textContent = "🗑️ Remover";
    btnRemover.addEventListener("click", () => removerProduto(produto.id));

    acoes.appendChild(btnEditar);
    acoes.appendChild(btnToggleAtivo);
    acoes.appendChild(btnRemover);

    conteudo.appendChild(nome);
    conteudo.appendChild(descricao);
    conteudo.appendChild(preco);
    conteudo.appendChild(estoque);
    conteudo.appendChild(categoria);
    conteudo.appendChild(status);
    conteudo.appendChild(acoes);

    card.appendChild(conteudo);
    listaAdmin.appendChild(card);
  });
}

// ==========================================================
// 6. ATIVAR / DESATIVAR PRODUTO
// ==========================================================
// Some do cardápio do cliente sem apagar o histórico do produto do banco.
// Depende da página do cliente filtrar por "ativo = true" na consulta.

async function alternarAtivoProduto(id, ativoAtual) {
  const { error } = await supabaseClient
    .from("produtos")
    .update({ ativo: !ativoAtual })
    .eq("id", id);

  if (error) {
    console.error("Erro ao alternar status do produto:", error);
    alert("Não foi possível alterar o status do produto.");
    return;
  }

  await carregarProdutos();
}

// ==========================================================
// 7. CADASTRAR / SALVAR EDIÇÃO DE PRODUTO
// ==========================================================
// O mesmo formulário agora serve pros dois casos. Se produtoEditandoId
// estiver preenchido, faz UPDATE em vez de INSERT. editarProduto()
// (seção 9) é quem liga esse modo.

if (formProduto) {
  formProduto.addEventListener("submit", async function (event) {
    event.preventDefault();

    const emEdicao = produtoEditandoId !== null;

    if (msgCadastro) {
      msgCadastro.textContent = emEdicao
        ? "Salvando alterações..."
        : "Cadastrando produto...";
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

    // FOTO (opcional na edição — só sobe se o usuário escolher um arquivo novo)

    const inputFoto = document.getElementById("foto-produto");
    const arquivoFoto = inputFoto?.files?.[0];

    let urlFoto = null;

    if (arquivoFoto) {
      const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
      const tamanhoMaximo = 5 * 1024 * 1024;

      if (!tiposPermitidos.includes(arquivoFoto.type)) {
        if (msgCadastro)
          msgCadastro.textContent = "Formato inválido. Use JPG, PNG ou WEBP.";
        return;
      }

      if (arquivoFoto.size > tamanhoMaximo) {
        if (msgCadastro)
          msgCadastro.textContent = "A imagem deve ter no máximo 5 MB.";
        return;
      }

      const extensao = arquivoFoto.name.split(".").pop()?.toLowerCase();

      if (!extensao) {
        if (msgCadastro)
          msgCadastro.textContent =
            "Não foi possível identificar a extensão da imagem.";
        return;
      }

      const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
      const caminhoArquivo = nomeArquivo;

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

      if (erroUpload) {
        console.error("Erro definitivo ao enviar foto:", erroUpload);
        if (msgCadastro) {
          msgCadastro.textContent =
            "Não foi possível enviar a foto. Verifique sua conexão e o Storage do Supabase.";
        }
        return;
      }

      const { data: dadosFoto } = supabaseClient.storage
        .from("produtos")
        .getPublicUrl(caminhoArquivo);

      if (!dadosFoto?.publicUrl) {
        console.error("Supabase não retornou a URL pública da imagem.");
        if (msgCadastro)
          msgCadastro.textContent =
            "A foto foi enviada, mas não foi possível obter a URL.";
        return;
      }

      urlFoto = dadosFoto.publicUrl;
    }

    const dadosProduto = {
      nome: nome,
      preco: preco,
      descricao: descricao || null,
      estoque: estoque,
      categoria: categoria,
      ativo: true,
    };

    // só inclui "foto" se uma nova foi enviada — senão mantém a atual
    if (urlFoto) {
      dadosProduto.foto = urlFoto;
    }

    let error;

    if (emEdicao) {
      const resultado = await supabaseClient
        .from("produtos")
        .update(dadosProduto)
        .eq("id", produtoEditandoId);

      error = resultado.error;
    } else {
      const resultado = await supabaseClient
        .from("produtos")
        .insert(dadosProduto)
        .select()
        .single();

      error = resultado.error;
    }

    if (error) {
      console.error(
        emEdicao ? "Erro ao editar produto:" : "Erro ao cadastrar produto:",
        error,
      );
      msgCadastro.textContent = emEdicao
        ? "Erro ao salvar alterações."
        : "Erro ao cadastrar produto.";
      return;
    }

    msgCadastro.textContent = emEdicao
      ? "Produto atualizado com sucesso!"
      : "Produto cadastrado com sucesso!";

    sairDoModoEdicao();
    formProduto.reset();

    await carregarProdutos();
    await atualizarResumo();
  });
}

// CANCELAR EDIÇÃO

function sairDoModoEdicao() {
  produtoEditandoId = null;

  if (btnSubmitProduto) btnSubmitProduto.textContent = "+ Cadastrar Produto";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "none";
}

if (btnCancelarEdicao) {
  btnCancelarEdicao.addEventListener("click", () => {
    sairDoModoEdicao();
    formProduto.reset();
    if (msgCadastro) msgCadastro.textContent = "";
  });
}

// ==========================================================
// 8. BUSCAR PRODUTOS
// ==========================================================

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

// ==========================================================
// 9. EDITAR / REMOVER PRODUTO
// ==========================================================
// Antes: prompt() encadeado só pra nome e preço (categoria, estoque,
// descrição e foto ficavam impossíveis de editar, e cancelar o segundo
// prompt perdia a edição inteira). Agora: reaproveita o formulário de
// cadastro, pré-preenchido, e troca pra modo "salvar alterações".

async function editarProduto(id) {
  const { data: produto, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !produto) {
    console.error("Erro ao buscar produto:", error);
    alert("Não foi possível carregar o produto.");
    return;
  }

  produtoEditandoId = produto.id;

  document.getElementById("nome").value = produto.nome || "";
  document.getElementById("preco").value = produto.preco ?? "";
  document.getElementById("descricao").value = produto.descricao || "";
  document.getElementById("estoque").value = produto.estoque ?? "";
  document.getElementById("categoria").value = produto.categoria || "";
  document.getElementById("foto-produto").value = "";

  if (btnSubmitProduto) btnSubmitProduto.textContent = "💾 Salvar Alterações";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "";

  if (msgCadastro) {
    msgCadastro.textContent =
      "Editando produto — a foto atual é mantida se você não escolher uma nova.";
  }

  document
    .getElementById("secao-produtos")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function removerProduto(id) {
  const confirmar = confirm("Deseja realmente remover este produto?");
  if (!confirmar) return;

  const { error } = await supabaseClient.from("produtos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao remover produto:", error);
    alert("Não foi possível remover o produto.");
    return;
  }

  // se o produto removido era o que estava em edição, sai do modo edição
  if (produtoEditandoId === id) {
    sairDoModoEdicao();
    formProduto.reset();
  }

  alert("Produto removido com sucesso!");

  await carregarProdutos();
  await atualizarResumo();
}

// ==========================================================
// 10. RESUMO DO PAINEL
// ==========================================================

async function atualizarResumo() {
  const { count: quantidadeProdutos, error: erroProdutos } =
    await supabaseClient
      .from("produtos")
      .select("id", { count: "exact", head: true });

  if (!erroProdutos && totalProdutos) {
    totalProdutos.textContent = quantidadeProdutos || 0;
  }

  const { data: pedidos, error: erroPedidos } = await supabaseClient
    .from("pedidos")
    .select("id, total");

  if (!erroPedidos && pedidos) {
    if (totalPedidos) totalPedidos.textContent = pedidos.length;

    const vendas = pedidos.reduce(
      (total, pedido) => total + Number(pedido.total || 0),
      0,
    );

    if (totalVendas) totalVendas.textContent = formatarMoeda(vendas);

    if (ticketMedio) {
      const ticket = pedidos.length > 0 ? vendas / pedidos.length : 0;
      ticketMedio.textContent = formatarMoeda(ticket);
    }
  }
}

// ==========================================================
// 11. CONFIRMAR PEDIDO (status + baixa de estoque + WhatsApp)
// ==========================================================

// DÁ BAIXA NO ESTOQUE DE CADA ITEM DO PEDIDO CONFIRMADO
async function darBaixaEstoque(pedido) {
  if (!pedido.itens_pedido || pedido.itens_pedido.length === 0) return;

  for (const item of pedido.itens_pedido) {
    if (!item.produto_id) continue; // produto pode ter sido removido do cardápio depois

    const { data: produto, error: erroBusca } = await supabaseClient
      .from("produtos")
      .select("estoque")
      .eq("id", item.produto_id)
      .single();

    if (erroBusca || !produto) {
      console.warn(
        `Produto ${item.produto_id} não encontrado para dar baixa no estoque.`,
      );
      continue;
    }

    const novoEstoque = Math.max(0, (produto.estoque || 0) - item.quantidade);

    const { error: erroAtualizar } = await supabaseClient
      .from("produtos")
      .update({ estoque: novoEstoque })
      .eq("id", item.produto_id);

    if (erroAtualizar) {
      console.error(
        `Erro ao atualizar estoque do produto ${item.produto_id}:`,
        erroAtualizar,
      );
    }
  }
}

// CONFIRMAR PEDIDO: atualiza status, dá baixa no estoque e abre o WhatsApp
// já com a mensagem pronta (o funcionário só confere e envia).
async function confirmarPedido(pedido) {
  const { error } = await supabaseClient
    .from("pedidos")
    .update({ status: "pronto" })
    .eq("id", pedido.id);

  if (error) {
    console.error("Erro ao confirmar pedido:", error);
    alert("Não foi possível confirmar o pedido.");
    return;
  }

  await darBaixaEstoque(pedido);

  const numero = formatarNumeroWhatsApp(pedido.telefone);
  const mensagem = montarMensagemConfirmacao(pedido);
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");

  await carregarPedidos(filtroStatusPedido?.value || "todos");
  await carregarProdutos();
  await atualizarResumo();
}

// ==========================================================
// 12. CARREGAR PEDIDOS
// ==========================================================
// Trocado de innerHTML com template string para createElement/textContent.
// nome_cliente, telefone, endereco, referencia e observacoes vêm de um
// formulário que QUALQUER CLIENTE preenche no quiosque/delivery, sem
// sanitização. Com innerHTML, um cliente colocando algo como
// "<img src=x onerror=...>" no campo Observações executaria esse código
// no navegador de quem estiver logado no painel admin ao abrir a lista
// de pedidos. Com textContent isso vira texto puro.

async function carregarPedidos(status = "todos") {
  if (!listaPedidos) return;

  listaPedidos.innerHTML = `<p class="estado-admin">Carregando pedidos...</p>`;

  let consulta = supabaseClient
    .from("pedidos")
    .select("*, itens_pedido(*)")
    .order("id", { ascending: false });

  if (status !== "todos") {
    consulta = consulta.eq("status", status);
  }

  const { data, error } = await consulta;

  if (error) {
    console.error("Erro ao carregar pedidos:", error);
    listaPedidos.innerHTML = `<p class="estado-admin">Erro ao carregar pedidos.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    listaPedidos.innerHTML = `<p class="estado-admin">Nenhum pedido encontrado.</p>`;
    return;
  }

  listaPedidos.innerHTML = "";

  data.forEach((pedido) => {
    const card = document.createElement("article");
    card.className = "card-pedido";

    const titulo = document.createElement("h3");
    titulo.textContent = `Pedido #${pedido.id}`;
    card.appendChild(titulo);

    const linhas = [
      ["Cliente", pedido.nome_cliente],
      ["WhatsApp", formatarTelefoneExibicao(pedido.telefone)],
      ["Tipo", pedido.tipo_pedido],
    ];

    if (pedido.mesa) linhas.push(["Mesa", formatarMesa(pedido.mesa)]);
    if (pedido.endereco) linhas.push(["Endereço", pedido.endereco]);
    if (pedido.referencia) linhas.push(["Referência", pedido.referencia]);

    linhas.push(["Forma de pagamento", pedido.forma_pagamento]);
    linhas.push(["Subtotal", formatarMoeda(pedido.subtotal)]);

    // Taxa de entrega só faz sentido pra pedidos de delivery
    if (pedido.tipo_pedido === "delivery") {
      linhas.push(["Taxa de entrega", formatarMoeda(pedido.taxa_entrega)]);
    }

    linhas.push(["Total", formatarMoeda(pedido.total)]);

    if (pedido.observacoes) linhas.push(["Observações", pedido.observacoes]);

    linhas.forEach(([rotulo, valor]) => {
      const p = document.createElement("p");
      p.textContent = `${rotulo}: ${valor || "-"}`;
      card.appendChild(p);
    });

    // Itens do pedido — só mostra o bloco se houver pelo menos 1 item
    if (pedido.itens_pedido && pedido.itens_pedido.length > 0) {
      const tituloItens = document.createElement("p");
      tituloItens.className = "titulo-itens";
      tituloItens.textContent = "Itens:";
      card.appendChild(tituloItens);

      const listaItens = document.createElement("ul");
      listaItens.className = "itens-pedido";

      pedido.itens_pedido.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.quantidade}x ${item.nome_produto} — ${formatarMoeda(item.subtotal)}`;
        listaItens.appendChild(li);
      });

      card.appendChild(listaItens);
    }

    const status = document.createElement("span");
    status.className = "status";
    status.textContent = pedido.status || "pendente";
    card.appendChild(status);

    // Botão "Confirmar pedido" — só aparece se ainda não foi confirmado
    if (
      pedido.status !== "pronto" &&
      pedido.status !== "entregue" &&
      pedido.status !== "cancelado"
    ) {
      const btnConfirmar = document.createElement("button");
      btnConfirmar.type = "button";
      btnConfirmar.className = "btn-confirmar-pedido";
      btnConfirmar.textContent = "✅ Confirmar pedido";
      btnConfirmar.addEventListener("click", () => confirmarPedido(pedido));
      card.appendChild(btnConfirmar);
    }

    listaPedidos.appendChild(card);
  });
}

// ==========================================================
// 13. FILTRO E LIMPEZA MANUAL DE PEDIDOS
// ==========================================================

if (filtroStatusPedido) {
  filtroStatusPedido.addEventListener("change", function () {
    carregarPedidos(filtroStatusPedido.value);
  });
}

// APAGAR PEDIDOS PRONTOS MANUALMENTE
// Requer que a foreign key de itens_pedido tenha ON DELETE CASCADE
// (ver instrução do ALTER TABLE combinada anteriormente).
if (btnApagarProntos) {
  btnApagarProntos.addEventListener("click", async () => {
    const confirmar = confirm(
      "Deseja apagar todos os pedidos com status 'pronto'?",
    );
    if (!confirmar) return;

    const { error } = await supabaseClient
      .from("pedidos")
      .delete()
      .eq("status", "pronto");

    if (error) {
      console.error("Erro ao apagar pedidos prontos:", error);
      alert("Não foi possível apagar os pedidos prontos.");
      return;
    }

    alert("Pedidos prontos apagados com sucesso!");
    await carregarPedidos(filtroStatusPedido?.value || "todos");
    await atualizarResumo();
  });
}

// ==========================================================
// 14. CONFIGURAÇÃO DE DELIVERY (tabela "configuracoes")
// ==========================================================

async function carregarConfigDelivery() {
  if (!inputTaxa || !inputTempo) return;

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
    idConfiguracao = data.id;
    inputTaxa.value = data.taxa_entrega;
    inputTempo.value = data.tempo_entrega || "";
  } else {
    idConfiguracao = null;
    inputTaxa.value = "";
    inputTempo.value = "";
  }
}

if (formDelivery) {
  formDelivery.addEventListener("submit", async function (event) {
    event.preventDefault();

    const taxa = Number(inputTaxa.value);
    const tempo = inputTempo.value.trim();

    if (Number.isNaN(taxa) || taxa < 0) {
      if (msgDelivery) msgDelivery.textContent = "Informe uma taxa válida.";
      return;
    }

    if (!tempo) {
      if (msgDelivery)
        msgDelivery.textContent = "Informe o tempo estimado de entrega.";
      return;
    }

    if (msgDelivery) msgDelivery.textContent = "Salvando...";

    let erro = null;

    if (idConfiguracao) {
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
      const resultado = await supabaseClient
        .from("configuracoes")
        .insert({ taxa_entrega: taxa, tempo_entrega: tempo })
        .select()
        .single();

      erro = resultado.error;

      if (!erro && resultado.data) {
        idConfiguracao = resultado.data.id;
      }
    }

    if (erro) {
      console.error("Erro ao salvar configuração de delivery:", erro);
      if (msgDelivery) msgDelivery.textContent = "Erro ao salvar configuração.";
      return;
    }

    if (msgDelivery)
      msgDelivery.textContent = "Configuração salva com sucesso!";
  });
}

// ==========================================================
// 15. CONFIGURAÇÃO DO QUIOSQUE (tabela "mesas")
// ==========================================================
// Gera as mesas 1..N na tabela "mesas" (upsert por "numero") e DESATIVA
// (não deleta) mesas acima da nova quantidade, pra não perder o
// histórico de pedidos antigos que referenciam elas.

async function carregarConfigQuiosque() {
  if (!inputQuantidadeMesas) return;

  const { data, error } = await supabaseClient
    .from("mesas")
    .select("numero")
    .eq("ativa", true)
    .order("numero", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erro ao carregar configuração do quiosque:", error);
    return;
  }

  if (data && data.length > 0) {
    inputQuantidadeMesas.value = data[0].numero;
  }
}

if (formQuiosque) {
  formQuiosque.addEventListener("submit", async function (event) {
    event.preventDefault();

    const quantidade = Number(inputQuantidadeMesas.value);

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      if (msgQuiosque)
        msgQuiosque.textContent = "Informe uma quantidade válida de mesas.";
      return;
    }

    if (msgQuiosque) msgQuiosque.textContent = "Salvando...";

    const mesas = Array.from({ length: quantidade }, (_, i) => ({
      numero: i + 1,
      ativa: true,
    }));

    const { error: erroUpsert } = await supabaseClient
      .from("mesas")
      .upsert(mesas, { onConflict: "numero" });

    if (erroUpsert) {
      console.error("Erro ao salvar mesas:", erroUpsert);
      if (msgQuiosque) msgQuiosque.textContent = "Erro ao salvar as mesas.";
      return;
    }

    // desativa (sem deletar) qualquer mesa numerada acima da nova quantidade
    const { error: erroDesativar } = await supabaseClient
      .from("mesas")
      .update({ ativa: false })
      .gt("numero", quantidade);

    if (erroDesativar) {
      console.error("Erro ao desativar mesas excedentes:", erroDesativar);
    }

    if (msgQuiosque) msgQuiosque.textContent = "Mesas atualizadas com sucesso!";
  });
}

// ==========================================================
// 16. FUNCIONAMENTO DA LOJA (horários + modo manual)
// ==========================================================

async function carregarHorarios() {
  if (!listaHorarios) return;

  listaHorarios.innerHTML =
    '<p class="estado-admin">Carregando horários...</p>';

  const { data, error } = await supabaseClient
    .from("horarios")
    .select("*")
    .order("dia_semana", { ascending: true });

  if (error) {
    console.error("Erro ao carregar horários:", error);
    listaHorarios.innerHTML =
      '<p class="estado-admin">Erro ao carregar horários.</p>';
    return;
  }

  renderizarHorarios(data || []);
}

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

// ==========================================================
// 17. RELATÓRIOS
// ==========================================================

function calcularIntervaloRelatorio(periodo) {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);

  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "7dias") {
    inicio.setDate(inicio.getDate() - 6);
  } else if (periodo === "30dias") {
    inicio.setDate(inicio.getDate() - 29);
  } else if (periodo === "mes") {
    inicio.setDate(1);
  }

  return { inicio, fim };
}

async function gerarRelatorio() {
  if (!selectRelatorioPeriodo) return;

  const periodo = selectRelatorioPeriodo.value;
  const { inicio, fim } = calcularIntervaloRelatorio(periodo);

  const { data: pedidos, error } = await supabaseClient
    .from("pedidos")
    .select("id, total, criado_em, itens_pedido(quantidade)")
    .gte("criado_em", inicio.toISOString())
    .lte("criado_em", fim.toISOString())
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("Erro ao gerar relatório:", error);
    if (tabelaRelatorio) {
      tabelaRelatorio.innerHTML = `<tr><td colspan="5">Erro ao carregar relatório.</td></tr>`;
    }
    return;
  }

  const lista = pedidos || [];

  const totalVendasPeriodo = lista.reduce(
    (soma, p) => soma + Number(p.total || 0),
    0,
  );
  const totalPedidosCount = lista.length;
  const ticket = totalPedidosCount > 0 ? totalVendasPeriodo / totalPedidosCount : 0;

  const totalProdutosVendidos = lista.reduce((soma, p) => {
    const itens = p.itens_pedido || [];
    return (
      soma + itens.reduce((s, item) => s + Number(item.quantidade || 0), 0)
    );
  }, 0);

  if (relatorioTotalVendas)
    relatorioTotalVendas.textContent = formatarMoeda(totalVendasPeriodo);
  if (relatorioTotalPedidos)
    relatorioTotalPedidos.textContent = totalPedidosCount;
  if (relatorioTicketMedio)
    relatorioTicketMedio.textContent = formatarMoeda(ticket);
  if (relatorioProdutosVendidos)
    relatorioProdutosVendidos.textContent = totalProdutosVendidos;

  renderizarTabelaRelatorio(lista);
}

function renderizarTabelaRelatorio(pedidos) {
  if (!tabelaRelatorio) return;

  if (pedidos.length === 0) {
    tabelaRelatorio.innerHTML = `<tr><td colspan="5">Nenhum pedido no período.</td></tr>`;
    return;
  }

  const porDia = {};

  pedidos.forEach((pedido) => {
    const data = new Date(pedido.criado_em);
    const chave = data.toLocaleDateString("pt-BR");

    if (!porDia[chave]) {
      porDia[chave] = { pedidos: 0, produtos: 0, vendas: 0 };
    }

    porDia[chave].pedidos += 1;
    porDia[chave].vendas += Number(pedido.total || 0);

    const itens = pedido.itens_pedido || [];
    porDia[chave].produtos += itens.reduce(
      (s, item) => s + Number(item.quantidade || 0),
      0,
    );
  });

  tabelaRelatorio.innerHTML = "";

  Object.keys(porDia).forEach((dia) => {
    const linha = porDia[dia];
    const ticketDia = linha.pedidos > 0 ? linha.vendas / linha.pedidos : 0;

    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = dia;

    const tdPedidos = document.createElement("td");
    tdPedidos.textContent = linha.pedidos;

    const tdProdutos = document.createElement("td");
    tdProdutos.textContent = linha.produtos;

    const tdVendas = document.createElement("td");
    tdVendas.className = "valor";
    tdVendas.textContent = formatarMoeda(linha.vendas);

    const tdTicket = document.createElement("td");
    tdTicket.textContent = formatarMoeda(ticketDia);

    tr.appendChild(tdData);
    tr.appendChild(tdPedidos);
    tr.appendChild(tdProdutos);
    tr.appendChild(tdVendas);
    tr.appendChild(tdTicket);

    tabelaRelatorio.appendChild(tr);
  });
}

// O relatório atualiza sozinho ao trocar o período — não existe mais
// botão "Gerar relatório" separado.
if (selectRelatorioPeriodo) {
  selectRelatorioPeriodo.addEventListener("change", gerarRelatorio);
}

if (btnAtualizarRelatorio) {
  btnAtualizarRelatorio.addEventListener("click", gerarRelatorio);
}

// ==========================================================
// 18. IMPRESSÃO DO RELATÓRIO
// ==========================================================
// Ao imprimir, só a folha com os 4 números do período aparece — o
// resto da página fica escondido (ver @media print no style.css).

function rotuloPeriodoRelatorio(periodo) {
  const rotulos = {
    hoje: "Hoje",
    "7dias": "Últimos 7 dias",
    "30dias": "Últimos 30 dias",
    mes: "Este mês",
  };
  return rotulos[periodo] || "Período selecionado";
}

if (btnImprimirRelatorio) {
  btnImprimirRelatorio.addEventListener("click", () => {
    if (!areaImpressao) {
      window.print();
      return;
    }

    const periodo = selectRelatorioPeriodo?.value || "hoje";
    const dataGeracao = new Date().toLocaleDateString("pt-BR");

    areaImpressao.innerHTML = "";

    const titulo = document.createElement("h2");
    titulo.textContent = "Point 🍔 Hambúrguer — Relatório de Vendas";
    areaImpressao.appendChild(titulo);

    const subtitulo = document.createElement("p");
    subtitulo.className = "subtitulo-impressao";
    subtitulo.textContent = `Período: ${rotuloPeriodoRelatorio(periodo)} — Gerado em ${dataGeracao}`;
    areaImpressao.appendChild(subtitulo);

    const itens = [
      ["💰 Total vendido", relatorioTotalVendas?.textContent],
      ["🛒 Pedidos", relatorioTotalPedidos?.textContent],
      ["🍔 Produtos vendidos", relatorioProdutosVendidos?.textContent],
      ["📈 Ticket médio", relatorioTicketMedio?.textContent],
    ];

    itens.forEach(([rotulo, valor]) => {
      const p = document.createElement("p");
      p.className = "linha-impressao";
      p.textContent = `${rotulo}: ${(valor || "-").trim()}`;
      areaImpressao.appendChild(p);
    });

    window.print();
  });
}

// ==========================================================
// 19. NOTIFICAÇÃO SONORA DE NOVO PEDIDO
// ==========================================================
// Depende do painel estar aberto no navegador — não funciona em
// segundo plano com o navegador fechado.

function tocarSomNotificacao() {
  try {
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganho.gain.value = 0.3;

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);

    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.4);
  } catch (erro) {
    console.warn("Não foi possível tocar o som de notificação:", erro);
  }
}

supabaseClient
  .channel("novos-pedidos")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "pedidos" },
    (payload) => {
      console.log("Novo pedido recebido:", payload.new);
      tocarSomNotificacao();
      carregarPedidos(filtroStatusPedido?.value || "todos");
      atualizarResumo();
    },
  )
  .subscribe();

// ==========================================================
// 20. LIMPEZA AUTOMÁTICA DE PEDIDOS PRONTOS
// ==========================================================
// 1 hora após o horário de fechamento do dia, apaga os pedidos com
// status "pronto". Só roda enquanto o painel estiver aberto no
// navegador — verifica a cada 5 minutos.

async function limparPedidosProntosAntigos() {
  const agora = new Date();
  const diaSemana = agora.getDay();

  const { data: horario, error } = await supabaseClient
    .from("horarios")
    .select("aberto, fechamento")
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  if (error || !horario || !horario.aberto || !horario.fechamento) return;

  const [horaFechamento, minutoFechamento] = horario.fechamento
    .split(":")
    .map(Number);

  const fechamentoHoje = new Date(agora);
  fechamentoHoje.setHours(horaFechamento, minutoFechamento, 0, 0);

  const limiteExclusao = new Date(fechamentoHoje.getTime() + 60 * 60 * 1000);

  if (agora < limiteExclusao) return;

  const { error: erroExclusao } = await supabaseClient
    .from("pedidos")
    .delete()
    .eq("status", "pronto");

  if (erroExclusao) {
    console.error("Erro ao limpar pedidos prontos antigos:", erroExclusao);
    return;
  }

  await carregarPedidos(filtroStatusPedido?.value || "todos");
  await atualizarResumo();
}

setInterval(limparPedidosProntosAntigos, 5 * 60 * 1000);

// ==========================================================
// 21. SAIR
// ==========================================================

function sair() {
  const confirmar = confirm("Deseja sair do painel?");
  if (!confirmar) return;
  window.location.href = "../../index.html";
}

window.sair = sair;

// ==========================================================
// 22. INICIALIZAÇÃO
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Painel administrativo iniciado.");

  const conectado = await testarSupabase();

  if (!conectado) {
    console.error("Painel não conseguiu conectar ao Supabase.");
    return;
  }

  await limparPedidosProntosAntigos();
  await carregarProdutos();
  await carregarPedidos();
  await atualizarResumo();
  await carregarConfigDelivery();
  await carregarConfigQuiosque();
  await carregarHorarios();
  await carregarModoLoja();
  await gerarRelatorio();
});