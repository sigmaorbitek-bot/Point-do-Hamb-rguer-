// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

const listaItens = document.getElementById("lista-itens");

const inputBusca = document.getElementById("busca-input");

const botoesFiltro = document.querySelectorAll(".filtro-btn");

// ==================================================
// CARRINHO
// ==================================================

const carrinho = {
  itens: [],
};

// Elementos do carrinho
const carrinhoElemento = document.getElementById("carrinho");
const carrinhoFlutuante = document.getElementById("carrinho-flutuante");
const carrinhoFechar = document.getElementById("carrinho-fechar");
const carrinhoItens = document.getElementById("carrinho-itens");
const carrinhoTotalValor = document.getElementById("carrinho-total-valor");
const carrinhoContador = document.getElementById("carrinho-contador");
const btnFinalizar = document.getElementById("btn-finalizar");

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
// MODAL
// ==================================================

const modalPedido = document.getElementById("modal-pedido");

const modalFechar = document.getElementById("modal-fechar");

const formPedido = document.getElementById("form-pedido");

const mensagemPedido = document.getElementById("mensagem-pedido");

// ==================================================
// RESUMO DO PEDIDO (dentro do modal)
// ==================================================

const resumoSubtotal = document.getElementById("resumo-subtotal");

const resumoTotal = document.getElementById("resumo-total");

// ==================================================
// MESA
// ==================================================

const selectMesa = document.getElementById("qual-mesa");

// ==================================================
// PRODUTOS
// ==================================================

let produtos = [];

// Categoria selecionada atualmente

let categoriaAtual = "todos";

// ==================================================
// FORMATAR PREÇO
// ==================================================

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==================================================
// CARREGAR PRODUTOS DO SUPABASE
// ==================================================

async function carregarProdutos() {
  try {
    // Mensagem de carregamento

    listaItens.innerHTML = `
      <p class="estado-cardapio">
        Carregando cardápio...
      </p>
    `;

    // Busca produtos no Supabase

    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome");

    // Verifica erro

    if (error) {
      console.error("Erro ao carregar produtos:", error);

      mostrarErroProdutos("Não foi possível carregar o cardápio.");

      return;
    }

    // Guarda os produtos

    produtos = data || [];

    // Nenhum produto

    if (produtos.length === 0) {
      listaItens.innerHTML = `
        <p class="estado-cardapio">
          Nenhum produto disponível.
        </p>
      `;

      return;
    }

    // Renderiza

    renderizarProdutos(produtos);
  } catch (erro) {
    console.error("Erro inesperado ao carregar produtos:", erro);

    mostrarErroProdutos("Ocorreu um erro ao carregar o cardápio.");
  }
}

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================

function renderizarProdutos(listaProdutos) {
  listaItens.innerHTML = "";

  // Nenhum resultado

  if (listaProdutos.length === 0) {
    listaItens.innerHTML = `
      <p class="estado-cardapio">
        Nenhum produto encontrado.
      </p>
    `;

    return;
  }

  // Percorre os produtos

  listaProdutos.forEach((produto) => {
    // ==================================================
    // CARD
    // ==================================================

    const card = document.createElement("article");

    card.className = "card-produto";

    // Categoria

    card.dataset.categoria = normalizarCategoria(produto.categoria);

    // ==================================================
    // IMAGEM
    // ==================================================

    const imagem = document.createElement("img");

    if (produto.foto) {
      imagem.src = produto.foto;
    } else {
      imagem.src = "../assets/produto-sem-foto.png";
    }

    imagem.alt = produto.nome || "Produto";

    imagem.loading = "lazy";

    // Se a imagem quebrar

    imagem.onerror = () => {
      imagem.onerror = null;

      imagem.src = "../assets/produto-sem-foto.png";
    };

    // ==================================================
    // CONTEÚDO
    // ==================================================

    const conteudo = document.createElement("div");

    conteudo.className = "card-produto-conteudo";

    // ==================================================
    // NOME
    // ==================================================

    const nome = document.createElement("h3");

    nome.textContent = produto.nome || "Produto";

    // ==================================================
    // DESCRIÇÃO
    // ==================================================

    const descricao = document.createElement("p");

    descricao.textContent =
      produto.descricao || "Produto selecionado pelo Point do Hambúrguer.";

    // ==================================================
    // PREÇO
    // ==================================================

    const preco = document.createElement("span");

    preco.className = "preco";

    preco.textContent = formatarMoeda(produto.preco);

    // ==================================================
    // ESTOQUE
    // ==================================================

    const estoque = document.createElement("p");

    estoque.className = "produto-estoque";

    const quantidadeEstoque = Number(produto.estoque || 0);

    if (quantidadeEstoque > 0) {
      estoque.textContent = `Disponível: ${quantidadeEstoque}`;
    } else {
      estoque.textContent = "Produto esgotado";

      estoque.classList.add("produto-esgotado");
    }

    // ==================================================
    // BOTÃO
    // ==================================================

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

    // ==================================================
    // EVENTO DO BOTÃO
    // ==================================================

    botao.addEventListener("click", () => {
      adicionarAoCarrinho(produto);
    });

    // ==================================================
    // MONTAR CONTEÚDO
    // ==================================================

    conteudo.appendChild(nome);

    conteudo.appendChild(descricao);

    conteudo.appendChild(preco);

    conteudo.appendChild(estoque);

    conteudo.appendChild(botao);

    // ==================================================
    // MONTAR CARD
    // ==================================================

    card.appendChild(imagem);

    card.appendChild(conteudo);

    // ==================================================
    // ADICIONAR NA LISTA
    // ==================================================

    listaItens.appendChild(card);
  });
}

// ==================================================
// NORMALIZAR CATEGORIA
// ==================================================

function normalizarCategoria(categoria) {
  return String(categoria || "")
    .trim()
    .toLowerCase();
}

// ==================================================
// FILTROS DE CATEGORIA
// ==================================================

botoesFiltro.forEach((botao) => {
  botao.addEventListener("click", () => {
    // Remove ativo de todos

    botoesFiltro.forEach((btn) => {
      btn.classList.remove("ativo");
    });

    // Ativa botão clicado

    botao.classList.add("ativo");

    // Guarda categoria

    categoriaAtual = normalizarCategoria(botao.dataset.categoria);

    // Aplica filtros

    aplicarFiltros();
  });
});

// ==================================================
// BUSCA
// ==================================================

inputBusca.addEventListener("input", () => {
  aplicarFiltros();
});

// ==================================================
// APLICAR FILTROS
// ==================================================

function aplicarFiltros() {
  const termo = inputBusca.value.trim().toLowerCase();

  const produtosFiltrados = produtos.filter((produto) => {
    // ==================================================
    // CATEGORIA
    // ==================================================

    const categoriaProduto = normalizarCategoria(produto.categoria);

    const passaCategoria =
      categoriaAtual === "todos" || categoriaProduto === categoriaAtual;

    // ==================================================
    // NOME
    // ==================================================

    const nomeProduto = String(produto.nome || "").toLowerCase();

    // ==================================================
    // DESCRIÇÃO
    // ==================================================

    const descricaoProduto = String(produto.descricao || "").toLowerCase();

    // ==================================================
    // BUSCA
    // ==================================================

    const passaBusca =
      nomeProduto.includes(termo) || descricaoProduto.includes(termo);

    // ==================================================
    // RESULTADO
    // ==================================================

    return passaCategoria && passaBusca;
  });

  // Renderiza resultado

  renderizarProdutos(produtosFiltrados);
}

// ==================================================
// ADICIONAR AO CARRINHO
// ==================================================

function adicionarAoCarrinho(produto) {
  const quantidadeEstoque = Number(produto.estoque || 0);

  // Procura produto no carrinho

  const itemExistente = carrinho.itens.find((item) => item.id === produto.id);

  // ==================================================
  // VERIFICAR LIMITE DO ESTOQUE
  // ==================================================

  if (itemExistente && itemExistente.quantidade >= quantidadeEstoque) {
    return;
  }

  // ==================================================
  // JÁ EXISTE
  // ==================================================

  if (itemExistente) {
    itemExistente.quantidade += 1;
  }

  // ==================================================
  // NOVO ITEM
  // ==================================================
  else {
    carrinho.itens.push({
      id: produto.id,

      nome: produto.nome,

      preco: Number(produto.preco),

      quantidade: 1,
    });
  }

  // Atualiza carrinho

  renderizarCarrinho();
}

// ==================================================
// DIMINUIR QUANTIDADE
// ==================================================

function diminuirQuantidade(produtoId) {
  const item = carrinho.itens.find((item) => item.id === produtoId);

  if (!item) {
    return;
  }

  item.quantidade -= 1;

  // Remove se chegar a zero

  if (item.quantidade <= 0) {
    carrinho.itens = carrinho.itens.filter((item) => item.id !== produtoId);
  }

  renderizarCarrinho();
}

// ==================================================
// AUMENTAR QUANTIDADE
// ==================================================

function aumentarQuantidade(produtoId) {
  const item = carrinho.itens.find((item) => item.id === produtoId);

  if (!item) {
    return;
  }

  // Procura produto original

  const produto = produtos.find((produto) => produto.id === produtoId);

  if (!produto) {
    return;
  }

  const estoque = Number(produto.estoque || 0);

  // Não deixa ultrapassar estoque

  if (item.quantidade >= estoque) {
    return;
  }

  item.quantidade += 1;

  renderizarCarrinho();
}

// ==================================================
// CALCULAR TOTAL
// ==================================================

function calcularTotal() {
  return carrinho.itens.reduce((total, item) => {
    return total + item.preco * item.quantidade;
  }, 0);
}

// ==================================================
// CALCULAR QUANTIDADE TOTAL
// ==================================================

function calcularQuantidadeItens() {
  return carrinho.itens.reduce((total, item) => {
    return total + item.quantidade;
  }, 0);
}

// ==================================================
// RENDERIZAR CARRINHO
// ==================================================

function renderizarCarrinho() {
  const total = calcularTotal();

  const quantidade = calcularQuantidadeItens();

  // ==================================================
  // TOTAL
  // ==================================================

  carrinhoTotalValor.textContent = formatarMoeda(total);

  // ==================================================
  // CONTADOR
  // ==================================================

  carrinhoContador.textContent = quantidade;

  // ==================================================
  // CARRINHO VAZIO
  // ==================================================

  if (carrinho.itens.length === 0) {
    carrinhoItens.innerHTML = `
      <p class="carrinho-vazio">
        Seu carrinho está vazio
      </p>
    `;

    btnFinalizar.disabled = true;

    return;
  }

  // ==================================================
  // HABILITAR BOTÃO
  // ==================================================

  btnFinalizar.disabled = false;

  // Limpa carrinho

  carrinhoItens.innerHTML = "";

  // ==================================================
  // RENDERIZAR ITENS
  // ==================================================

  carrinho.itens.forEach((item) => {
    const linha = document.createElement("div");

    linha.className = "carrinho-linha";

    // ==================================================
    // INFORMAÇÕES
    // ==================================================

    const informacoes = document.createElement("div");

    informacoes.className = "carrinho-item-info";

    const nome = document.createElement("strong");

    nome.textContent = item.nome;

    const detalhes = document.createElement("span");

    detalhes.textContent = `${formatarMoeda(item.preco)} × ${item.quantidade}`;

    informacoes.appendChild(nome);

    informacoes.appendChild(detalhes);

    // ==================================================
    // CONTROLES
    // ==================================================

    const controles = document.createElement("div");

    controles.className = "carrinho-controles";

    const botaoMenos = document.createElement("button");

    botaoMenos.type = "button";

    botaoMenos.className = "btn-remover";

    botaoMenos.textContent = "−";

    const quantidade = document.createElement("span");

    quantidade.textContent = item.quantidade;

    const botaoMais = document.createElement("button");

    botaoMais.type = "button";

    botaoMais.className = "btn-adicionar-qtd";

    botaoMais.textContent = "+";

    controles.appendChild(botaoMenos);

    controles.appendChild(quantidade);

    controles.appendChild(botaoMais);

    // ==================================================
    // SUBTOTAL
    // ==================================================

    const subtotal = document.createElement("strong");

    subtotal.className = "carrinho-item-subtotal";

    subtotal.textContent = formatarMoeda(item.preco * item.quantidade);

    // ==================================================
    // MONTAR LINHA
    // ==================================================

    linha.appendChild(informacoes);

    linha.appendChild(controles);

    linha.appendChild(subtotal);

    carrinhoItens.appendChild(linha);

    // ==================================================
    // BOTÃO -
    // ==================================================

    botaoMenos.addEventListener("click", () => {
      diminuirQuantidade(item.id);
    });

    // ==================================================
    // BOTÃO +
    // ==================================================

    botaoMais.addEventListener("click", () => {
      aumentarQuantidade(item.id);
    });
  });
}

// ==================================================
// CARREGAR MESAS DO SUPABASE
// ==================================================

async function carregarMesas() {
  try {
    const { data, error } = await supabaseClient
      .from("mesas")
      .select("*")
      .eq("ativa", true)
      .order("numero");

    // Erro

    if (error) {
      console.error("Erro ao carregar mesas:", error);

      return;
    }

    // Limpa opções

    selectMesa.innerHTML = `
      <option value="">
        Selecione sua mesa
      </option>
    `;

    // Adiciona mesas
    // OBS: o "value" guarda o NÚMERO da mesa (não o id interno),
    // porque a coluna "mesa" na tabela "pedidos" é texto livre,
    // não uma referência (foreign key) pra tabela "mesas".

    (data || []).forEach((mesa) => {
      const option = document.createElement("option");

      option.value = mesa.numero;

      option.textContent = `Mesa ${String(mesa.numero).padStart(2, "0")}`;

      selectMesa.appendChild(option);
    });
  } catch (erro) {
    console.error("Erro inesperado ao carregar mesas:", erro);
  }
}

// ==================================================
// ABRIR MODAL
// ==================================================

btnFinalizar.addEventListener("click", () => {
  if (carrinho.itens.length === 0) {
    return;
  }

  // Preenche o resumo do pedido com os valores atuais do carrinho

  const total = calcularTotal();

  resumoSubtotal.textContent = formatarMoeda(total);
  resumoTotal.textContent = formatarMoeda(total);

  modalPedido.classList.add("ativo");

  modalPedido.setAttribute("aria-hidden", "false");
});

// ==================================================
// FECHAR MODAL
// ==================================================

function fecharModal() {
  modalPedido.classList.remove("ativo");

  modalPedido.setAttribute("aria-hidden", "true");
}

// ==================================================
// BOTÃO FECHAR
// ==================================================

modalFechar.addEventListener("click", fecharModal);

// ==================================================
// FECHAR CLICANDO FORA
// ==================================================

modalPedido.addEventListener("click", (evento) => {
  if (evento.target === modalPedido) {
    fecharModal();
  }
});

// ==================================================
// FECHAR COM ESC
// ==================================================

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

  // ==================================================
  // VERIFICAR CARRINHO
  // ==================================================

  if (carrinho.itens.length === 0) {
    return;
  }

  // ==================================================
  // ELEMENTOS DO FORMULÁRIO
  // ==================================================

  const botao = document.getElementById("btn-confirmar-pedido");

  const nome = document.getElementById("nome").value.trim();

  const telefone = document.getElementById("telefone").value.trim();

  const mesa = selectMesa.value;

  const formaPagamento = document.getElementById("forma-pagamento").value;

  const observacoes = document.getElementById("observacoes").value.trim();

  const total = calcularTotal();

  // ==================================================
  // VALIDAÇÃO
  // ==================================================

  if (!nome || !telefone || !mesa || !formaPagamento) {
    mensagemPedido.textContent = "Preencha todos os campos obrigatórios.";

    return;
  }

  // ==================================================
  // DESABILITAR BOTÃO
  // ==================================================

  botao.disabled = true;

  botao.textContent = "Enviando...";

  mensagemPedido.textContent = "";

  try {
    // ==================================================
    // CRIAR O PEDIDO (tabela "pedidos")
    // ==================================================
    // As colunas aqui batem com o schema real:
    // nome_cliente, tipo_pedido, mesa, subtotal e
    // taxa_entrega são todas obrigatórias.
    // Não existe coluna "itens" nessa tabela — os itens
    // vão numa tabela separada, "itens_pedido", depois.

    const { data: pedidoCriado, error } = await supabaseClient
      .from("pedidos")
      .insert({
        nome_cliente: nome,
        telefone: telefone,
        tipo_pedido: "quiosque",
        mesa: mesa,
        forma_pagamento: formaPagamento,
        subtotal: total,
        taxa_entrega: 0,
        total: total,
        observacoes: observacoes || null,
        status: "pendente",
      })
      .select()
      .single();

    // ==================================================
    // ERRO
    // ==================================================

    if (error) {
      console.error("Erro ao enviar pedido:", error);

      mensagemPedido.textContent = "Não foi possível enviar o pedido.";

      return;
    }

    // ==================================================
    // SALVAR OS ITENS (tabela "itens_pedido")
    // ==================================================

    const itensParaSalvar = carrinho.itens.map((item) => ({
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
      // o pedido já foi criado — só os itens que não foram salvos.
      // Registra no console pra investigar, mas não trava o fluxo
      // pro cliente, já que o pedido em si já chegou.
      console.error("Erro ao salvar itens do pedido:", erroItens);
    }

    // ==================================================
    // SUCESSO
    // ==================================================

    mensagemPedido.textContent = "Pedido enviado com sucesso!";

    // Limpa carrinho

    carrinho.itens = [];

    renderizarCarrinho();

    // Limpa formulário

    formPedido.reset();

    // Fecha modal

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
// MENSAGEM DE ERRO
// ==================================================

function mostrarErroProdutos(mensagem) {
  listaItens.innerHTML = `
    <p class="estado-cardapio">
      ${mensagem}
    </p>
  `;
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();

  carregarMesas();

  renderizarCarrinho();
});