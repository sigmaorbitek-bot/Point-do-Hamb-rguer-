// ==================================================
// CONFIGURAÇÕES GERAIS
// ==================================================

// Valor de segurança usado ENQUANTO a taxa real não chega do Supabase.
// Assim que carregarConfiguracoes() responder, esse valor é substituído.
let TAXA_ENTREGA = 0;

// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

const listaItens = document.getElementById("lista-itens");
const inputBusca = document.getElementById("busca-input");
const botoesFiltro = document.querySelectorAll(".filtro-btn");

// Carrinho flutuante (abrir/fechar)
const carrinhoElemento = document.getElementById("carrinho");
const carrinhoFlutuante = document.getElementById("carrinho-flutuante");
const carrinhoFechar = document.getElementById("carrinho-fechar");
const carrinhoItens = document.getElementById("carrinho-itens");
const carrinhoSubtotal = document.getElementById("carrinho-subtotal");
const taxaEntregaEl = document.getElementById("taxa-entrega");
const carrinhoTotalValor = document.getElementById("carrinho-total-valor");
const carrinhoContador = document.getElementById("carrinho-contador");
const btnFinalizar = document.getElementById("btn-finalizar");

// Modal
const modalPedido = document.getElementById("modal-pedido");
const modalFechar = document.getElementById("modal-fechar");
const formPedido = document.getElementById("form-pedido");
const mensagemPedido = document.getElementById("mensagem-pedido");
const resumoSubtotal = document.getElementById("resumo-subtotal");
const resumoTaxa = document.getElementById("resumo-taxa");
const resumoTotal = document.getElementById("resumo-total");

// ==================================================
// ESTADO
// ==================================================

let produtos = [];
let categoriaAtual = "todos";
let carrinho = [];

// ==================================================
// FORMATAR MOEDA
// ==================================================

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==================================================
// CARREGAR TAXA DE ENTREGA (tabela "configuracoes")
// ==================================================
// ASSUNÇÃO: tabela "configuracoes" com uma única linha e coluna
// "taxa_entrega" (numeric). Se o painel salvar diferente (chave/valor,
// id fixo, etc.), me passa o formato real que eu ajusto essa function.

async function carregarConfiguracoes() {
  try {
    const { data, error } = await supabaseClient
      .from("configuracoes")
      .select("taxa_entrega")
      .limit(1)
      .single();

    if (error) {
      console.error("Erro ao carregar configurações:", error);
      return; // mantém o valor padrão, não trava a página por isso
    }

    if (data && typeof data.taxa_entrega === "number") {
      TAXA_ENTREGA = data.taxa_entrega;
    }

    renderizarCarrinho();
  } catch (erro) {
    console.error("Erro inesperado ao carregar configurações:", erro);
  }
}

// ==================================================
// ABRIR / FECHAR O PAINEL DO CARRINHO
// ==================================================

carrinhoFlutuante.addEventListener("click", () => {
  carrinhoElemento.classList.add("aberto");
  carrinhoFlutuante.classList.add("escondido");
  carrinhoFlutuante.setAttribute("aria-expanded", "true");
});

carrinhoFechar.addEventListener("click", () => {
  carrinhoElemento.classList.remove("aberto");
  carrinhoFlutuante.classList.remove("escondido");
  carrinhoFlutuante.setAttribute("aria-expanded", "false");
});

// ==================================================
// CARREGAR PRODUTOS
// ==================================================

async function carregarProdutos() {
  try {
    listaItens.innerHTML =
      '<p class="estado-cardapio">Carregando cardápio...</p>';

    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      mostrarErroProdutos("Não foi possível carregar o cardápio.");
      return;
    }

    produtos = data || [];

    if (produtos.length === 0) {
      listaItens.innerHTML =
        '<p class="estado-cardapio">Nenhum produto disponível.</p>';
      return;
    }

    renderizarProdutos(produtos);
  } catch (erro) {
    console.error("Erro inesperado ao carregar produtos:", erro);
    mostrarErroProdutos("Ocorreu um erro ao carregar o cardápio.");
  }
}

function mostrarErroProdutos(mensagem) {
  listaItens.innerHTML = `<p class="estado-cardapio">${mensagem}</p>`;
}

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================
// createElement/textContent em vez de innerHTML com template string:
// nome/descrição vêm do banco (cadastrados via painel admin) e não
// devem ser interpretados como HTML.

function renderizarProdutos(listaProdutos) {
  listaItens.innerHTML = "";

  if (listaProdutos.length === 0) {
    listaItens.innerHTML =
      '<p class="estado-cardapio">Nenhum produto encontrado.</p>';
    return;
  }

  listaProdutos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "card-produto";
    card.dataset.categoria = normalizarCategoria(produto.categoria);

    const imagem = document.createElement("img");
    imagem.src = produto.foto || "../assets/produto-sem-foto.png";
    imagem.alt = produto.nome || "Produto";
    imagem.loading = "lazy";
    imagem.onerror = () => {
      imagem.onerror = null;
      imagem.src = "../assets/produto-sem-foto.png";
    };

    const conteudo = document.createElement("div");
    conteudo.className = "card-produto-conteudo";

    const nome = document.createElement("h3");
    nome.textContent = produto.nome || "Produto";

    const descricao = document.createElement("p");
    descricao.textContent =
      produto.descricao || "Produto selecionado pelo Point do Hambúrguer.";

    const preco = document.createElement("span");
    preco.className = "preco";
    preco.textContent = formatarMoeda(produto.preco);

    const estoque = document.createElement("p");
    estoque.className = "produto-estoque";
    const quantidadeEstoque = Number(produto.estoque || 0);

    if (quantidadeEstoque > 0) {
      estoque.textContent = `Disponível: ${quantidadeEstoque}`;
    } else {
      estoque.textContent = "Produto esgotado";
      estoque.classList.add("produto-esgotado");
    }

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn-adicionar";

    if (quantidadeEstoque > 0) {
      botao.textContent = "🛒 Adicionar";
      botao.disabled = false;
    } else {
      botao.textContent = "Produto esgotado";
      botao.disabled = true;
    }

    botao.addEventListener("click", () => adicionarAoCarrinho(produto));

    conteudo.appendChild(nome);
    conteudo.appendChild(descricao);
    conteudo.appendChild(preco);
    conteudo.appendChild(estoque);
    conteudo.appendChild(botao);

    card.appendChild(imagem);
    card.appendChild(conteudo);

    listaItens.appendChild(card);
  });
}

function normalizarCategoria(categoria) {
  return String(categoria || "")
    .trim()
    .toLowerCase();
}

// ==================================================
// FILTROS DE CATEGORIA + BUSCA
// ==================================================

botoesFiltro.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoesFiltro.forEach((btn) => btn.classList.remove("ativo"));
    botao.classList.add("ativo");
    categoriaAtual = normalizarCategoria(botao.dataset.categoria);
    aplicarFiltros();
  });
});

inputBusca.addEventListener("input", () => aplicarFiltros());

function aplicarFiltros() {
  const termo = inputBusca.value.trim().toLowerCase();

  const produtosFiltrados = produtos.filter((produto) => {
    const categoriaProduto = normalizarCategoria(produto.categoria);
    const passaCategoria =
      categoriaAtual === "todos" || categoriaProduto === categoriaAtual;

    const nomeProduto = String(produto.nome || "").toLowerCase();
    const descricaoProduto = String(produto.descricao || "").toLowerCase();
    const passaBusca =
      nomeProduto.includes(termo) || descricaoProduto.includes(termo);

    return passaCategoria && passaBusca;
  });

  renderizarProdutos(produtosFiltrados);
}

// ==================================================
// CARRINHO — ADICIONAR / REMOVER / ATUALIZAR
// ==================================================

function adicionarAoCarrinho(produto) {
  const quantidadeEstoque = Number(produto.estoque || 0);
  const itemExistente = carrinho.find((item) => item.id === produto.id);

  if (itemExistente && itemExistente.quantidade >= quantidadeEstoque) {
    return;
  }

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade: 1,
    });
  }

  renderizarCarrinho();
}

function diminuirQuantidade(produtoId) {
  const item = carrinho.find((item) => item.id === produtoId);
  if (!item) return;

  item.quantidade -= 1;

  if (item.quantidade <= 0) {
    carrinho = carrinho.filter((item) => item.id !== produtoId);
  }

  renderizarCarrinho();
}

function aumentarQuantidade(produtoId) {
  const item = carrinho.find((item) => item.id === produtoId);
  if (!item) return;

  const produto = produtos.find((produto) => produto.id === produtoId);
  if (!produto) return;

  const estoque = Number(produto.estoque || 0);
  if (item.quantidade >= estoque) return;

  item.quantidade += 1;
  renderizarCarrinho();
}

function calcularTotais() {
  const subtotal = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0,
  );
  const taxa = carrinho.length > 0 ? TAXA_ENTREGA : 0;
  const total = subtotal + taxa;
  return { subtotal, taxa, total };
}

function calcularQuantidadeItens() {
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

function renderizarCarrinho() {
  const { subtotal, taxa, total } = calcularTotais();
  const quantidade = calcularQuantidadeItens();

  carrinhoSubtotal.textContent = formatarMoeda(subtotal);
  taxaEntregaEl.textContent = formatarMoeda(taxa);
  carrinhoTotalValor.textContent = formatarMoeda(total);
  carrinhoContador.textContent = quantidade;

  if (carrinho.length === 0) {
    carrinhoItens.innerHTML =
      '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
    btnFinalizar.disabled = true;
    return;
  }

  btnFinalizar.disabled = false;
  carrinhoItens.innerHTML = "";

  carrinho.forEach((item) => {
    const linha = document.createElement("div");
    linha.className = "carrinho-linha";

    const informacoes = document.createElement("div");
    informacoes.className = "carrinho-item-info";

    const nome = document.createElement("strong");
    nome.textContent = item.nome;

    const detalhes = document.createElement("span");
    detalhes.textContent = `${formatarMoeda(item.preco)} × ${item.quantidade}`;

    informacoes.appendChild(nome);
    informacoes.appendChild(detalhes);

    const controles = document.createElement("div");
    controles.className = "carrinho-controles";

    const botaoMenos = document.createElement("button");
    botaoMenos.type = "button";
    botaoMenos.className = "btn-remover";
    botaoMenos.textContent = "−";
    botaoMenos.addEventListener("click", () => diminuirQuantidade(item.id));

    const quantidadeEl = document.createElement("span");
    quantidadeEl.textContent = item.quantidade;

    const botaoMais = document.createElement("button");
    botaoMais.type = "button";
    botaoMais.className = "btn-adicionar-qtd";
    botaoMais.textContent = "+";
    botaoMais.addEventListener("click", () => aumentarQuantidade(item.id));

    controles.appendChild(botaoMenos);
    controles.appendChild(quantidadeEl);
    controles.appendChild(botaoMais);

    const subtotalItem = document.createElement("strong");
    subtotalItem.className = "carrinho-item-subtotal";
    subtotalItem.textContent = formatarMoeda(item.preco * item.quantidade);

    linha.appendChild(informacoes);
    linha.appendChild(controles);
    linha.appendChild(subtotalItem);

    carrinhoItens.appendChild(linha);
  });
}

// ==================================================
// ABRIR MODAL
// ==================================================

btnFinalizar.addEventListener("click", () => {
  if (carrinho.length === 0) return;

  const { subtotal, taxa, total } = calcularTotais();
  resumoSubtotal.textContent = formatarMoeda(subtotal);
  resumoTaxa.textContent = formatarMoeda(taxa);
  resumoTotal.textContent = formatarMoeda(total);

  modalPedido.classList.add("ativo");
  modalPedido.setAttribute("aria-hidden", "false");
});

function fecharModal() {
  modalPedido.classList.remove("ativo");
  modalPedido.setAttribute("aria-hidden", "true");
}

modalFechar.addEventListener("click", fecharModal);

modalPedido.addEventListener("click", (evento) => {
  if (evento.target === modalPedido) fecharModal();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && modalPedido.classList.contains("ativo")) {
    fecharModal();
  }
});

// ==================================================
// ENVIAR PEDIDO
// ==================================================

formPedido.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (carrinho.length === 0) return;

  const botao = document.getElementById("btn-confirmar-pedido");

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const referencia = document.getElementById("referencia").value.trim();
  const formaPagamento = document.getElementById("forma-pagamento").value;
  const observacoes = document.getElementById("observacoes").value.trim();

  const { subtotal, taxa, total } = calcularTotais();

  if (!nome || !telefone || !endereco || !formaPagamento) {
    mensagemPedido.textContent = "Preencha todos os campos obrigatórios.";
    return;
  }

  botao.disabled = true;
  botao.textContent = "Enviando...";
  mensagemPedido.textContent = "";

  try {
    // ==================================================
    // CRIAR O PEDIDO (tabela "pedidos")
    // ==================================================
    // Mesmo padrão do quiosque: itens vão em "itens_pedido",
    // não soltos dentro de "pedidos".

    const { data: pedidoCriado, error } = await supabaseClient
      .from("pedidos")
      .insert({
        nome_cliente: nome,
        telefone: telefone,
        tipo_pedido: "delivery",
        endereco: endereco,
        referencia: referencia || null,
        forma_pagamento: formaPagamento,
        subtotal: subtotal,
        taxa_entrega: taxa,
        total: total,
        observacoes: observacoes || null,
        status: "pendente",
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao enviar pedido:", error);
      mensagemPedido.textContent = "Não foi possível enviar o pedido.";
      return;
    }

    // ==================================================
    // SALVAR OS ITENS (tabela "itens_pedido")
    // ==================================================

    const itensParaSalvar = carrinho.map((item) => ({
      pedido_id: pedidoCriado.id,
      produto_id: item.id,
      nome_produto: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.preco * item.quantidade,
    }));

    const { error: erroItens } = await supabaseClient
      .from("itens_pedido")
      .insert(itensParaSalvar);

    if (erroItens) {
      // pedido já foi criado — só os itens que não foram salvos.
      // Loga pra investigar, mas não trava o fluxo pro cliente.
      console.error("Erro ao salvar itens do pedido:", erroItens);
    }

    mensagemPedido.textContent = "Pedido enviado com sucesso!";

    carrinho = [];
    renderizarCarrinho();
    formPedido.reset();

    setTimeout(() => {
      fecharModal();
      mensagemPedido.textContent = "";
    }, 1200);
  } catch (erro) {
    console.error("Erro inesperado:", erro);
    mensagemPedido.textContent = "Ocorreu um erro ao enviar o pedido.";
  } finally {
    botao.disabled = false;
    botao.textContent = "Confirmar Pedido";
  }
});

// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {
  const telaCarregamento = document.getElementById("tela-carregamento");

  await Promise.all([carregarConfiguracoes(), carregarProdutos()]);

  renderizarCarrinho();

  if (telaCarregamento) {
    telaCarregamento.classList.add("escondida");
  }
});
