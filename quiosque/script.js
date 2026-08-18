
// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

const listaItens = document.getElementById("lista-itens");
const carrinhoItens = document.getElementById("carrinho-itens");
const carrinhoSubtotal = document.getElementById("carrinho-subtotal");
const taxaEntregaEl = document.getElementById("taxa-entrega");
const carrinhoTotalValor = document.getElementById("carrinho-total-valor");
const inputBusca = document.getElementById("busca-input");
const botoesFiltro = document.querySelectorAll(".filtro-btn");

const modalPedido = document.getElementById("modal-pedido");
const btnFinalizar = document.getElementById("btn-finalizar");
const modalFechar = document.getElementById("modal-fechar");
const formPedido = document.getElementById("form-pedido");
const resumoSubtotal = document.getElementById("resumo-subtotal");
const resumoTaxa = document.getElementById("resumo-taxa");
const resumoTotal = document.getElementById("resumo-total");

// ==================================================
// CARRINHO
// ==================================================

let carrinho = [];

// ==================================================
// CARREGAR PRODUTOS
// ==================================================

async function carregarProdutos() {
  try {
    listaItens.innerHTML = '<p class="estado">Carregando produtos...</p>';

    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      listaItens.innerHTML =
        '<p class="estado">Não foi possível carregar o cardápio.</p>';
      return;
    }

    if (!data || data.length === 0) {
      listaItens.innerHTML = '<p class="estado">Nenhum produto disponível.</p>';
      return;
    }

    renderizarProdutos(data);
  } catch (erro) {
    console.error("Erro inesperado:", erro);
    listaItens.innerHTML = '<p class="estado">Erro ao carregar o cardápio.</p>';
  }
}

// ==================================================
// RENDERIZAR PRODUTOS (classes alinhadas com o style.css novo)
// ==================================================

function renderizarProdutos(produtos) {
  listaItens.innerHTML = "";

  produtos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "card-produto";
    card.dataset.categoria = produto.categoria;

    card.innerHTML = `
      ${produto.foto ? `<img src="${produto.foto}" alt="${produto.nome}" />` : ""}

      <div class="card-produto-conteudo">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao ?? ""}</p>
        <span class="preco">${formatarMoeda(produto.preco)}</span>
        <button type="button" class="btn-adicionar" data-id="${produto.id}">
          Adicionar
        </button>
      </div>
    `;

    listaItens.appendChild(card);

    const botao = card.querySelector(".btn-adicionar");
    botao.addEventListener("click", () => adicionarAoCarrinho(produto));
  });
}

// ==================================================
// FILTROS DE CATEGORIA + BUSCA
// ==================================================

botoesFiltro.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoesFiltro.forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    aplicarFiltros(botao.dataset.categoria);
  });
});

inputBusca.addEventListener("input", () => {
  const categoriaAtiva =
    document.querySelector(".filtro-btn.ativo").dataset.categoria;
  aplicarFiltros(categoriaAtiva);
});

function aplicarFiltros(categoria) {
  const termo = inputBusca.value.toLowerCase().trim();
  const itens = document.querySelectorAll(".card-produto");

  itens.forEach((item) => {
    const nome = item.querySelector("h3").textContent.toLowerCase();
    const itemCategoria = item.dataset.categoria;

    const passaCategoria = categoria === "todos" || itemCategoria === categoria;
    const passaBusca = nome.includes(termo);

    item.style.display = passaCategoria && passaBusca ? "" : "none";
  });
}

// ==================================================
// CARRINHO — ADICIONAR / REMOVER / ATUALIZAR
// ==================================================

function adicionarAoCarrinho(produto) {
  const itemExistente = carrinho.find((item) => item.id === produto.id);

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1,
    });
  }

  renderizarCarrinho();
}

function removerDoCarrinho(produtoId) {
  const itemExistente = carrinho.find((item) => item.id === produtoId);

  if (!itemExistente) return;

  itemExistente.quantidade -= 1;

  if (itemExistente.quantidade <= 0) {
    carrinho = carrinho.filter((item) => item.id !== produtoId);
  }

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

function renderizarCarrinho() {
  const { subtotal, taxa, total } = calcularTotais();

  carrinhoSubtotal.textContent = formatarMoeda(subtotal);
  taxaEntregaEl.textContent = formatarMoeda(taxa);
  carrinhoTotalValor.textContent = formatarMoeda(total);

  if (carrinho.length === 0) {
    carrinhoItens.innerHTML =
      '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
    return;
  }

  carrinhoItens.innerHTML = "";

  carrinho.forEach((item) => {
    const itemSubtotal = item.preco * item.quantidade;

    const linha = document.createElement("div");
    linha.className = "carrinho-item";

    linha.innerHTML = `
      <span class="carrinho-item-nome">${item.nome}</span>
      <div class="carrinho-item-qtd">
        <button type="button" data-id="${item.id}" class="btn-remover">-</button>
        <span>${item.quantidade}</span>
        <button type="button" data-id="${item.id}" class="btn-adicionar-qtd">+</button>
      </div>
      <span class="carrinho-item-subtotal">${formatarMoeda(itemSubtotal)}</span>
    `;

    carrinhoItens.appendChild(linha);

    linha
      .querySelector(".btn-remover")
      .addEventListener("click", () => removerDoCarrinho(item.id));
    linha.querySelector(".btn-adicionar-qtd").addEventListener("click", () => {
      adicionarAoCarrinho({ id: item.id, nome: item.nome, preco: item.preco });
    });
  });
}

// ==================================================
// MODAL — ABRIR / FECHAR
// ==================================================

btnFinalizar.addEventListener("click", () => {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio. Adicione algum item antes de finalizar.");
    return;
  }

  const { subtotal, taxa, total } = calcularTotais();
  resumoSubtotal.textContent = formatarMoeda(subtotal);
  resumoTaxa.textContent = formatarMoeda(taxa);
  resumoTotal.textContent = formatarMoeda(total);

  modalPedido.classList.add("ativo");
});

function fecharModal() {
  modalPedido.classList.remove("ativo");
}

modalFechar.addEventListener("click", fecharModal);

modalPedido.addEventListener("click", (e) => {
  if (e.target === modalPedido) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalPedido.classList.contains("ativo")) {
    fecharModal();
  }
});

// ==================================================
// ENVIAR PEDIDO
// ==================================================

formPedido.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { subtotal, taxa, total } = calcularTotais();

  const pedido = {
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    endereco: document.getElementById("endereco").value.trim(),
    referencia: document.getElementById("referencia").value.trim(),
    forma_pagamento: document.getElementById("forma-pagamento").value,
    observacoes: document.getElementById("observacoes").value.trim(),
    itens: carrinho,
    subtotal,
    taxa_entrega: taxa,
    total,
    status: "pendente",
    criado_em: new Date().toISOString(),
  };

  const botaoSubmit = formPedido.querySelector('button[type="submit"]');
  botaoSubmit.disabled = true;
  botaoSubmit.textContent = "Enviando...";

  try {
    const { error } = await supabaseClient.from("pedidos").insert([pedido]);

    if (error) {
      console.error("Erro ao enviar pedido:", error);
      alert("Não foi possível enviar seu pedido. Tente novamente.");
      return;
    }

    alert("Pedido enviado com sucesso! Em breve entraremos em contato.");

    carrinho = [];
    renderizarCarrinho();
    formPedido.reset();
    fecharModal();
  } catch (erro) {
    console.error("Erro inesperado:", erro);
    alert("Erro ao enviar o pedido.");
  } finally {
    botaoSubmit.disabled = false;
    botaoSubmit.textContent = "Confirmar Pedido";
  }
});

// ==================================================
// FORMATA MOEDA
// ==================================================

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
  renderizarCarrinho();
});
