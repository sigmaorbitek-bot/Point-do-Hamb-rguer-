// ==========================================================
// PAINEL ADMINISTRATIVO
// POINT DO HAMBÚRGUER
// ==========================================================


// ==========================================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================================

// Depois vamos colocar as informações do seu projeto aqui.
//
// IMPORTANTE:
// Não coloque a service_role key no navegador.
// Para o frontend usamos apenas a chave pública/publishable.

const SUPABASE_URL = "SUA_URL_AQUI";
const SUPABASE_KEY = "SUA_CHAVE_PUBLICA_AQUI";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================================================
// 2. ELEMENTOS DO PAINEL
// ==========================================================

const totalProdutos = document.getElementById(
  "total-produtos"
);

const totalPedidos = document.getElementById(
  "total-pedidos"
);

const totalVendas = document.getElementById(
  "total-vendas"
);

const listaAdmin = document.getElementById(
  "lista-admin"
);

const buscarAdmin = document.getElementById(
  "buscar-admin"
);

const formProduto = document.getElementById(
  "form-produto"
);

const msgCadastro = document.getElementById(
  "msg-cadastro"
);

const listaPedidos = document.getElementById(
  "lista-pedidos"
);

const filtroStatusPedido = document.getElementById(
  "filtro-status-pedido"
);


// ==========================================================
// 3. FORMATAÇÃO DE DINHEIRO
// ==========================================================

function formatarMoeda(valor) {

  return Number(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


// ==========================================================
// 4. CARREGAR PRODUTOS
// ==========================================================

async function carregarProdutos() {

  listaAdmin.innerHTML =
    `<p class="estado-admin">
      Carregando produtos...
    </p>`;

  const {
    data,
    error
  } = await supabaseClient
    .from("produto")
    .select("*")
    .order("id", {
      ascending: false
    });


  if (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );

    listaAdmin.innerHTML =
      `<p class="estado-admin">
        Erro ao carregar produtos.
      </p>`;

    return;
  }


  if (!data || data.length === 0) {

    listaAdmin.innerHTML =
      `<p class="estado-admin">
        Nenhum produto cadastrado.
      </p>`;

    totalProdutos.textContent = "0";

    return;
  }


  totalProdutos.textContent =
    data.length;


  renderizarProdutos(data);
}


// ==========================================================
// 5. MOSTRAR PRODUTOS NA TELA
// ==========================================================

function renderizarProdutos(produtos) {

  listaAdmin.innerHTML = "";


  produtos.forEach((produto) => {

    const card =
      document.createElement("article");

    card.className = "card-admin";


    card.innerHTML = `

      ${
        produto.foto
          ? `<img
              src="${produto.foto}"
              alt="${produto.nome}"
            >`
          : ""
      }

      <div class="card-admin-conteudo">

        <h3>
          ${produto.nome}
        </h3>

        <p>
          ${produto.descricao || "Sem descrição"}
        </p>

        <p class="preco">
          ${formatarMoeda(produto.preco)}
        </p>

        <p>
          Estoque:
          ${produto.estoque}
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


// ==========================================================
// 6. CADASTRAR PRODUTO
// ==========================================================

formProduto.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    msgCadastro.textContent =
      "Cadastrando produto...";


    const nome =
      document.getElementById("nome").value.trim();

    const preco =
      Number(
        document.getElementById("preco").value
      );

    const descricao =
      document.getElementById("descricao").value.trim();

    const estoque =
      Number(
        document.getElementById("estoque").value
      );

    const categoria =
      document.getElementById("categoria").value;


    // ------------------------------------------
    // VALIDAÇÃO
    // ------------------------------------------

    if (!nome) {

      msgCadastro.textContent =
        "Informe o nome do produto.";

      return;
    }


    if (preco < 0 || Number.isNaN(preco)) {

      msgCadastro.textContent =
        "Informe um preço válido.";

      return;
    }


    if (estoque < 0 || Number.isNaN(estoque)) {

      msgCadastro.textContent =
        "Informe um estoque válido.";

      return;
    }


    // ------------------------------------------
    // ENVIA PARA SUPABASE
    // ------------------------------------------

    const {
      data,
      error
    } = await supabaseClient
      .from("produto")
      .insert({

        nome: nome,

        preco: preco,

        descricao: descricao,

        estoque: estoque,

        categoria: categoria

      })
      .select()
      .single();


    if (error) {

      console.error(
        "Erro ao cadastrar produto:",
        error
      );

      msgCadastro.textContent =
        "Erro ao cadastrar produto.";

      return;
    }


    console.log(
      "Produto cadastrado:",
      data
    );


    msgCadastro.textContent =
      "Produto cadastrado com sucesso!";


    formProduto.reset();


    await carregarProdutos();

    await atualizarResumo();

  }
);


// ==========================================================
// 7. BUSCAR PRODUTO
// ==========================================================

buscarAdmin.addEventListener(
  "input",
  async function () {

    const termo =
      buscarAdmin.value
        .trim()
        .toLowerCase();


    const {
      data,
      error
    } = await supabaseClient
      .from("produto")
      .select("*")
      .ilike(
        "nome",
        `%${termo}%`
      )
      .order("id", {
        ascending: false
      });


    if (error) {

      console.error(
        "Erro na busca:",
        error
      );

      return;
    }


    renderizarProdutos(data);

  }
);


// ==========================================================
// 8. REMOVER PRODUTO
// ==========================================================

async function removerProduto(id) {

  const confirmar =
    confirm(
      "Deseja realmente remover este produto?"
    );


  if (!confirmar) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("produto")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(
      "Erro ao remover produto:",
      error
    );

    alert(
      "Não foi possível remover o produto."
    );

    return;
  }


  alert(
    "Produto removido com sucesso!"
  );


  await carregarProdutos();

  await atualizarResumo();

}


// ==========================================================
// 9. EDITAR PRODUTO
// ==========================================================

async function editarProduto(id) {

  const novoNome =
    prompt(
      "Digite o novo nome do produto:"
    );


  if (!novoNome) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("produto")
    .update({
      nome: novoNome.trim()
    })
    .eq("id", id);


  if (error) {

    console.error(
      "Erro ao editar produto:",
      error
    );

    alert(
      "Erro ao editar produto."
    );

    return;
  }


  alert(
    "Produto atualizado!"
  );


  await carregarProdutos();

}


// ==========================================================
// 10. RESUMO DO PAINEL
// ==========================================================

async function atualizarResumo() {

  // ------------------------------------------
  // PRODUTOS
  // ------------------------------------------

  const {
    count: quantidadeProdutos,
    error: erroProdutos
  } = await supabaseClient
    .from("produto")
    .select("*", {
      count: "exact",
      head: true
    });


  if (!erroProdutos) {

    totalProdutos.textContent =
      quantidadeProdutos || 0;

  }


  // ------------------------------------------
  // PEDIDOS
  // ------------------------------------------

  const {
    data: pedidos,
    error: erroPedidos
  } = await supabaseClient
    .from("pedido")
    .select("*");


  if (!erroPedidos && pedidos) {

    totalPedidos.textContent =
      pedidos.length;


    const vendas =
      pedidos.reduce(
        (total, pedido) => {

          return total +
            Number(
              pedido.total || 0
            );

        },
        0
      );


    totalVendas.textContent =
      formatarMoeda(vendas);

  }

}


// ==========================================================
// 11. CARREGAR PEDIDOS
// ==========================================================

async function carregarPedidos(
  status = "todos"
) {

  listaPedidos.innerHTML =
    `<p class="estado-admin">
      Carregando pedidos...
    </p>`;


  let consulta =
    supabaseClient
      .from("pedido")
      .select("*")
      .order("id", {
        ascending: false
      });


  if (status !== "todos") {

    consulta =
      consulta.eq(
        "status_pedido",
        status
      );

  }


  const {
    data,
    error
  } = await consulta;


  if (error) {

    console.error(
      "Erro ao carregar pedidos:",
      error
    );

    listaPedidos.innerHTML =
      `<p class="estado-admin">
        Erro ao carregar pedidos.
      </p>`;

    return;
  }


  if (!data || data.length === 0) {

    listaPedidos.innerHTML =
      `<p class="estado-admin">
        Nenhum pedido encontrado.
      </p>`;

    return;
  }


  listaPedidos.innerHTML = "";


  data.forEach((pedido) => {

    const card =
      document.createElement("article");

    card.className =
      "card-pedido";


    card.innerHTML = `

      <h3>
        Pedido #${pedido.id}
      </h3>

      <p>
        Cliente:
        ${pedido.cliente_nome || "-"}
      </p>

      <p>
        Telefone:
        ${pedido.telefone || "-"}
      </p>

      <p>
        Total:
        ${formatarMoeda(
          pedido.total || 0
        )}
      </p>

      <span class="status">
        ${pedido.status_pedido || "pendente"}
      </span>

    `;


    listaPedidos.appendChild(card);

  });

}


// ==========================================================
// 12. FILTRO DE PEDIDOS
// ==========================================================

filtroStatusPedido.addEventListener(
  "change",
  function () {

    carregarPedidos(
      filtroStatusPedido.value
    );

  }
);


// ==========================================================
// 13. SAIR DO PAINEL
// ==========================================================

function sair() {

  const confirmar =
    confirm(
      "Deseja sair do painel?"
    );


  if (!confirmar) {
    return;
  }


  window.location.href =
    "../../index.html";

}


// ==========================================================
// 14. INICIALIZAÇÃO
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "Painel administrativo iniciado."
    );


    await carregarProdutos();

    await carregarPedidos();

    await atualizarResumo();

  }
);