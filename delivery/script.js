// ==================================================
// CONFIGURAÇÃO DO SUPABASE
// ==================================================

const SUPABASE_URL = "SUA_URL_AQUI";
const SUPABASE_ANON_KEY = "SUA_CHAVE_AQUI";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// ==================================================
// DADOS MOCKADOS (temporário, antes do Supabase)
// ==================================================
const produtosMock = [
  {
    id: 1,
    nome: "X-Burger Clássico",
    descricao: "Pão, hambúrguer, queijo, alface, tomate e maionese da casa",
    preco: 18.00,
    imagem_url: "../assets/x-burger.png",
    categoria: "lanches",
    disponivel: true
  },
  {
    id: 2,
    nome: "X-Bacon",
    descricao: "Pão, hambúrguer, queijo, bacon crocante e molho especial",
    preco: 22.00,
    imagem_url: "../assets/x-bacon.png",
    categoria: "lanches",
    disponivel: true
  },
  {
    id: 3,
    nome: "X-Tudo",
    descricao: "Hambúrguer, queijo, bacon, ovo, presunto, alface e tomate",
    preco: 28.00,
    imagem_url: "../assets/x-tudo.png",
    categoria: "lanches",
    disponivel: true
  },
  {
    id: 4,
    nome: "Coca-Cola Lata",
    descricao: "350ml gelada",
    preco: 6.00,
    imagem_url: "../assets/coca-lata.png",
    categoria: "bebidas",
    disponivel: true
  },
  {
    id: 5,
    nome: "Suco de Laranja",
    descricao: "500ml natural",
    preco: 8.00,
    imagem_url: "../assets/suco-laranja.png",
    categoria: "bebidas",
    disponivel: true
  },
  {
    id: 6,
    nome: "Petit Gateau",
    descricao: "Bolo quente com sorvete de creme",
    preco: 15.00,
    imagem_url: "../assets/petit-gateau.png",
    categoria: "sobremesas",
    disponivel: true
  }
];

// ==================================================
// RENDERIZAR CARDÁPIO (usando o mock por enquanto)
// ==================================================
function carregarCardapio() {
  const lista = document.getElementById('lista-itens');
  lista.innerHTML = '';

  produtosMock.forEach(item => {
    lista.innerHTML += `
      <div class="item-cardapio" data-categoria="${item.categoria}">
        <img src="${item.imagem_url}" alt="${item.nome}">
        <h3>${item.nome}</h3>
        <p>${item.descricao}</p>
        <span class="preco">R$ ${item.preco.toFixed(2)}</span>
        <button class="btn-adicionar" data-id="${item.id}">
          Adicionar
        </button>
      </div>
    `;
  });
}
// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

const listaItens = document.getElementById("lista-itens");
const carrinhoItens = document.getElementById("carrinho-itens");
const carrinhoTotalValor = document.getElementById("carrinho-total-valor");
const inputBusca = document.getElementById("busca-input");
const botoesFiltro = document.querySelectorAll(".filtro-btn");

// ==================================================
// CARRINHO
// ==================================================

let carrinho = [];

// ==================================================
// CARREGAR PRODUTOS
// ==================================================

async function carregarProdutos() {
  try {
    listaItens.innerHTML = "<p>Carregando cardápio...</p>";

    const { data, error } = await supabaseClient
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("categoria")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      listaItens.innerHTML = "<p>Não foi possível carregar o cardápio.</p>";
      return;
    }

    if (!data || data.length === 0) {
      listaItens.innerHTML = "<p>Nenhum produto disponível.</p>";
      return;
    }

    renderizarProdutos(data);
  } catch (erro) {
    console.error("Erro inesperado:", erro);
    listaItens.innerHTML = "<p>Erro ao carregar o cardápio.</p>";
  }
}

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================

function renderizarProdutos(produtos) {
  listaItens.innerHTML = "";

  produtos.forEach((produto) => {
    const card = document.createElement("article");
    card.className = "item-cardapio";
    card.dataset.categoria = produto.categoria;

    card.innerHTML = `
      ${produto.foto ? `<img src="${produto.foto}" alt="${produto.nome}" class="produto-foto" />` : ""}

      <div class="produto-info">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao ?? ""}</p>
        <span class="preco">${formatarMoeda(produto.preco)}</span>
      </div>

      <button type="button" class="btn-adicionar" data-id="${produto.id}">
        Adicionar
      </button>
    `;

    listaItens.appendChild(card);

    // guarda os dados do produto no botão pra usar no carrinho
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
  const categoriaAtiva = document.querySelector(".filtro-btn.ativo").dataset.categoria;
  aplicarFiltros(categoriaAtiva);
});

function aplicarFiltros(categoria) {
  const termo = inputBusca.value.toLowerCase().trim();
  const itens = document.querySelectorAll(".item-cardapio");

  itens.forEach((item) => {
    const nome = item.querySelector("h3").textContent.toLowerCase();
    const itemCategoria = item.dataset.categoria;

    const passaCategoria = categoria === "todos" || itemCategoria === categoria;
    const passaBusca = nome.includes(termo);

    item.style.display = passaCategoria && passaBusca ? "flex" : "none";
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

function renderizarCarrinho() {
  if (carrinho.length === 0) {
    carrinhoItens.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio</p>';
    carrinhoTotalValor.textContent = formatarMoeda(0);
    return;
  }

  carrinhoItens.innerHTML = "";

  let total = 0;

  carrinho.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;

    const linha = document.createElement("div");
    linha.className = "carrinho-item";

    linha.innerHTML = `
      <span class="carrinho-item-nome">${item.nome}</span>
      <div class="carrinho-item-qtd">
        <button type="button" data-id="${item.id}" class="btn-remover">-</button>
        <span>${item.quantidade}</span>
        <button type="button" data-id="${item.id}" class="btn-adicionar-qtd">+</button>
      </div>
      <span class="carrinho-item-subtotal">${formatarMoeda(subtotal)}</span>
    `;

    carrinhoItens.appendChild(linha);

    linha.querySelector(".btn-remover").addEventListener("click", () => removerDoCarrinho(item.id));
    linha.querySelector(".btn-adicionar-qtd").addEventListener("click", () => {
      const produto = { id: item.id, nome: item.nome, preco: item.preco };
      adicionarAoCarrinho(produto);
    });
  });

  carrinhoTotalValor.textContent = formatarMoeda(total);
}

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
});