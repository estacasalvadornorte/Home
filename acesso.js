/* ═══════════════════════════════════════════════════════════════════════
   CÓDIGO DE ACESSO DA ÁREA DA LIDERANÇA
   Estaca Salvador Brasil Norte

   Este arquivo mostra a telinha que pede o código e libera a página
   depois que o código estiver certo. É usado pela Área da Liderança
   e pela tela de edição do calendário.
   ═══════════════════════════════════════════════════════════════════════ */


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  ONDE MEXER: CÓDIGO DE RESERVA                                      ║
   ║                                                                     ║
   ║  Quem confere o código normalmente é a planilha do Google.          ║
   ║  Este número aqui só é usado em duas situações:                     ║
   ║                                                                     ║
   ║    1. Antes de você colar o endereço da planilha no                 ║
   ║       componentes.js                                                ║
   ║    2. Se a internet ou a planilha estiverem fora do ar              ║
   ║                                                                     ║
   ║  Atenção: este número fica visível para quem abrir o código-fonte   ║
   ║  do site. Ele serve para evitar que alguém entre sem querer, não    ║
   ║  para guardar segredo. Quem protege as alterações do calendário de  ║
   ║  verdade é a planilha, que confere o código antes de salvar.        ║
   ║                                                                     ║
   ║  Se preferir, depois de configurar a planilha você pode deixar      ║
   ║  este valor vazio (duas aspas sem nada no meio).                    ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const CODIGO_RESERVA = '522236';


/* ═══════════════════════════════════════════════════════════════════════
   DAQUI PARA BAIXO NÃO PRECISA MEXER
   ═══════════════════════════════════════════════════════════════════════ */

function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

/**
 * Mostra a telinha do código. Quando o código estiver certo,
 * chama a função que monta o conteúdo da página.
 */
function protegerPagina(aoLiberar, idDaArea) {
  const area = document.getElementById(idDaArea || 'area-conteudo');
  if (!area) return;

  // Quem já entrou neste aparelho não precisa digitar de novo
  if (codigoSalvo()) {
    aoLiberar();
    return;
  }

  area.innerHTML = '' +
    '<div class="acesso-caixa">' +
      '<div class="acesso-cadeado">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="10" width="16" height="11" rx="2"/>' +
          '<path d="M8 10V7a4 4 0 0 1 8 0v3"/>' +
        '</svg>' +
      '</div>' +
      '<h2>Área restrita</h2>' +
      '<p>Digite o código de acesso da liderança.</p>' +
      '<form class="acesso-form" novalidate>' +
        '<input class="acesso-campo" type="password" inputmode="numeric" ' +
               'autocomplete="off" placeholder="Código" aria-label="Código de acesso">' +
        '<button class="ed-btn" type="submit">Entrar</button>' +
      '</form>' +
      '<p class="acesso-erro" hidden></p>' +
    '</div>';

  const form = area.querySelector('.acesso-form');
  const campo = area.querySelector('.acesso-campo');
  const botao = area.querySelector('.ed-btn');
  const aviso = area.querySelector('.acesso-erro');

  const mostrarErro = function (mensagem) {
    aviso.textContent = mensagem;
    aviso.hidden = false;
    botao.disabled = false;
    botao.textContent = 'Entrar';
    campo.select();
  };

  const liberar = function (codigo) {
    salvarCodigo(codigo);
    aoLiberar();
  };

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const codigo = campo.value.trim();
    if (!codigo) return;

    aviso.hidden = true;
    botao.disabled = true;
    botao.textContent = 'Conferindo...';

    // Sem o endereço da planilha, só resta o código de reserva
    if (!planilhaConfigurada()) {
      if (CODIGO_RESERVA && codigo === CODIGO_RESERVA) liberar(codigo);
      else mostrarErro('Código incorreto.');
      return;
    }

    planilhaEnviar('entrar', {}, codigo)
      .then(function () {
        liberar(codigo);
      })
      .catch(function (erro) {
        if (erro && erro.tipo === 'acesso') {
          mostrarErro('Código incorreto.');
          return;
        }
        // A planilha não respondeu: vale o código de reserva
        if (CODIGO_RESERVA && codigo === CODIGO_RESERVA) {
          liberar(codigo);
          return;
        }
        mostrarErro('Não foi possível falar com a planilha. Tente de novo em instantes.');
      });
  });

  campo.focus();
}
