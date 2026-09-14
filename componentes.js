/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES DO SITE - CABEÇALHO E RODAPÉ
   Estaca Salvador Brasil Norte

   Este arquivo monta o menu e o rodapé em TODAS as páginas.
   Você só precisa editar aqui, nunca nas páginas.
   ═══════════════════════════════════════════════════════════════════════ */


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  PARA ADICIONAR UMA PÁGINA NOVA AO MENU                             ║
   ║                                                                     ║
   ║  Copie uma linha da lista abaixo e cole na posição desejada.        ║
   ║  Troque o nome do arquivo e o nome que aparece no menu.            ║
   ║                                                                     ║
   ║  Modelo:                                                            ║
   ║    { arquivo: 'NOME-DO-ARQUIVO.html', nome: 'NOME NO MENU' },       ║
   ║                                                                     ║
   ║  Atenção: toda linha termina com vírgula, menos a última.           ║
   ║  A ordem da lista é a ordem que aparece no menu.                    ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const PAGINAS = [
  { arquivo: 'index.html',        nome: 'Início' },
  { arquivo: 'calendario.html',   nome: 'Calendário' },
  { arquivo: 'discursos.html',    nome: 'Discursos' },
  { arquivo: 'lideranca.html',    nome: 'Liderança' },
  { arquivo: 'treinamentos.html', nome: 'Treinamentos' }
];


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  TEXTOS DO CABEÇALHO E DO RODAPÉ                                    ║
   ║  Edite entre as aspas para mudar o que aparece no site.             ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const NOME_DA_ESTACA = 'Estaca Salvador Brasil Norte';
const TEXTO_DO_RODAPE = 'Estaca Salvador Brasil Norte &middot; 2026';


/* ═══════════════════════════════════════════════════════════════════════
   DAQUI PARA BAIXO NÃO PRECISA MEXER
   ═══════════════════════════════════════════════════════════════════════ */

// Descobre qual página está aberta para marcar o item ativo no menu
function paginaAtual() {
  let arquivo = window.location.pathname.split('/').pop();
  if (!arquivo || arquivo === '') {
    arquivo = 'index.html';
  }
  return arquivo;
}

// Monta o HTML do cabeçalho
function montarCabecalho() {
  const atual = paginaAtual();

  const itens = PAGINAS.map(function (pagina) {
    const ativo = (pagina.arquivo === atual) ? ' class="active"' : '';
    return '<li><a href="' + pagina.arquivo + '"' + ativo + '>' + pagina.nome + '</a></li>';
  }).join('');

  return '' +
    '<header class="site-header">' +
      '<div class="header-inner">' +
        '<a href="index.html" class="site-logo">' + NOME_DA_ESTACA + '</a>' +
        '<button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<ul class="nav-links">' + itens + '</ul>' +
      '</div>' +
    '</header>';
}

// Monta o HTML do rodapé
function montarRodape() {
  return '<footer class="site-footer">' + TEXTO_DO_RODAPE + '</footer>';
}

// Insere cabeçalho e rodapé nas áreas reservadas da página
function iniciarComponentes() {
  const areaCabecalho = document.getElementById('cabecalho');
  const areaRodape = document.getElementById('rodape');

  if (areaCabecalho) {
    areaCabecalho.outerHTML = montarCabecalho();
  }
  if (areaRodape) {
    areaRodape.outerHTML = montarRodape();
  }

  // Botão do menu no celular
  const botao = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');

  if (botao && menu) {
    botao.addEventListener('click', function () {
      const aberto = menu.classList.toggle('open');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  // Na página inicial, o cabeçalho fica transparente sobre a foto
  // e vira azul sólido quando a pessoa rola a página
  if (document.body.classList.contains('home-page')) {
    const cabecalho = document.querySelector('.site-header');
    const aoRolar = function () {
      cabecalho.classList.toggle('scrolled', window.scrollY > 40);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }
}

// Executa assim que a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarComponentes);
} else {
  iniciarComponentes();
}
