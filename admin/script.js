/* =========================================================
   LOGIN — ÁREA DO SISTEMA
   ========================================================= */


/* =========================================================
   1. ELEMENTOS
   ========================================================= */

const formLogin = document.getElementById("form-login");

const emailInput = document.getElementById("email");

const senhaInput = document.getElementById("senha");

const btnEntrar = document.getElementById("btn-entrar");

const mensagemLogin = document.getElementById("mensagem-login");


/* =========================================================
   2. MOSTRAR MENSAGEM
   ========================================================= */

function mostrarMensagem(mensagem, tipo = "") {

  mensagemLogin.textContent = mensagem;

  mensagemLogin.className = "mensagem-login";

  if (tipo) {
    mensagemLogin.classList.add(tipo);
  }

}


/* =========================================================
   3. ENTRAR
   ========================================================= */

async function entrar(event) {

  event.preventDefault();


  /* -------------------------------------------------------
     PEGA OS VALORES
     ------------------------------------------------------- */

  const email = emailInput.value.trim();

  const senha = senhaInput.value;


  /* -------------------------------------------------------
     VERIFICAÇÃO
     ------------------------------------------------------- */

  if (!email || !senha) {

    mostrarMensagem(
      "Preencha o e-mail e a senha.",
      "erro"
    );

    return;
  }


  /* -------------------------------------------------------
     DESABILITA O BOTÃO
     ------------------------------------------------------- */

  btnEntrar.disabled = true;

  btnEntrar.textContent = "Entrando...";

  mostrarMensagem("Verificando acesso...");


  try {

    /* -----------------------------------------------------
       LOGIN PELO SUPABASE AUTH
       ----------------------------------------------------- */

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha,
      });


    /* -----------------------------------------------------
       ERRO
       ----------------------------------------------------- */

    if (error) {

      console.error("Erro ao fazer login:", error);

      mostrarMensagem(
        "E-mail ou senha incorretos.",
        "erro"
      );

      return;
    }


    /* -----------------------------------------------------
       LOGIN REALIZADO
       ----------------------------------------------------- */

    console.log("Usuário autenticado:", data.user);

    mostrarMensagem(
      "Login realizado com sucesso!",
      "sucesso"
    );


    /* -----------------------------------------------------
       PEQUENO TEMPO PARA MOSTRAR A MENSAGEM
       ----------------------------------------------------- */

    setTimeout(() => {

      window.location.href = "../painel/index.html";

    }, 500);


  } catch (erro) {

    console.error("Erro inesperado:", erro);

    mostrarMensagem(
      "Ocorreu um erro ao tentar entrar.",
      "erro"
    );

  } finally {

    btnEntrar.disabled = false;

    btnEntrar.textContent = "🔐 Acessar";

  }

}


/* =========================================================
   4. VOLTAR PARA A LOJA
   ========================================================= */

function voltar() {

  window.location.href = "../index.html";

}


/* =========================================================
   5. EVENTO DO FORMULÁRIO
   ========================================================= */

if (formLogin) {

  formLogin.addEventListener(
    "submit",
    entrar
  );

}