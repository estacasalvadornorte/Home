/*
╔══════════════════════════════════════════════════════════════╗
║  PAINEL DA CONFERÊNCIA DA ESTACA                             ║
║  Script da planilha do Google                                ║
║                                                              ║
║  Este script guarda tudo o que é marcado na página           ║
║  conferencia.html do site. Ele roda dentro de uma planilha   ║
║  do seu Google Drive. Configuração feita uma vez só.         ║
║                                                              ║
║  PASSO A PASSO                                               ║
║                                                              ║
║  1. No Google Drive, crie uma planilha nova.                 ║
║     Nome sugerido: Painel Conferência da Estaca              ║
║                                                              ║
║  2. Na planilha, abra o menu Extensões > Apps Script.        ║
║                                                              ║
║  3. Apague o que estiver escrito no editor e cole            ║
║     este arquivo inteiro no lugar.                           ║
║                                                              ║
║  4. Troque o código de acesso no bloco ONDE MEXER logo       ║
║     abaixo e clique no ícone de disquete para salvar.        ║
║                                                              ║
║  5. Na barra de cima, escolha a função "configurar"          ║
║     e clique em Executar. O Google pede autorização:         ║
║     Revisar permissões > escolha sua conta > Avançado >      ║
║     Acessar (não seguro) > Permitir.                         ║
║     O aviso aparece porque o script é seu e não passou       ║
║     por revisão do Google. É normal.                         ║
║     As abas Conferencias e Tarefas surgem na planilha.       ║
║                                                              ║
║  6. Clique em Implantar > Nova implantação.                  ║
║     Na engrenagem ao lado de "Selecione o tipo",             ║
║     escolha App da Web e preencha:                           ║
║       Executar como ......... Eu                             ║
║       Quem pode acessar ..... Qualquer pessoa                ║
║     Clique em Implantar e copie o endereço do App da Web     ║
║     (termina com /exec).                                     ║
║                                                              ║
║  7. Cole esse endereço no arquivo conferencia.html,          ║
║     no bloco ONDE MEXER 1, e suba o arquivo no GitHub.       ║
║                                                              ║
║  TESTE RÁPIDO                                                ║
║  Abra o endereço do passo 6 no navegador. Deve aparecer      ║
║  uma mensagem dizendo que o painel está funcionando.         ║
║                                                              ║
║  SE UM DIA ALTERAR ESTE SCRIPT                               ║
║  Salve e vá em Implantar > Gerenciar implantações >          ║
║  lápis > Versão: Nova versão > Implantar.                    ║
║  Assim o endereço continua o mesmo e a página não muda.      ║
║                                                              ║
║  CUIDADOS                                                    ║
║  Não mude a ordem nem o nome das colunas da planilha.        ║
║  Pode consultar à vontade; para corrigir algo, prefira       ║
║  fazer pela própria página.                                  ║
╚══════════════════════════════════════════════════════════════╝
*/


/*
╔══════════════════════════════════════════════════════════════╗
║  ONDE MEXER: CÓDIGO DE ACESSO                                ║
║                                                              ║
║  É o código que as pessoas digitam para entrar no            ║
║  Acompanhamento. Troque o texto entre as aspas.              ║
║  Se mudar depois, quem já entrou vai precisar                ║
║  digitar o código novo (repita o passo final de              ║
║  SE UM DIA ALTERAR ESTE SCRIPT).                             ║
╚══════════════════════════════════════════════════════════════╝
*/
const CODIGO_ACESSO = 'troque-este-codigo';


/* ================================================================
   DAQUI PARA BAIXO É O FUNCIONAMENTO DO SCRIPT.
   Não é preciso mexer em nada abaixo desta linha.
   ================================================================ */

const FUSO = 'America/Bahia';
const ABA_CONF = 'Conferencias';
const ABA_TAREFAS = 'Tarefas';
const COL_CONF = ['id', 'nome', 'sabado', 'notas', 'notas_por', 'notas_em', 'criado_por', 'criado_em'];
const COL_TAREFAS = ['conferencia', 'tarefa', 'feito', 'feito_por', 'feito_em', 'observacao', 'obs_por', 'obs_em'];


/** Rode esta função uma vez pelo editor (passo 5). */
function configurar() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  prepararAba_(planilha, ABA_CONF, COL_CONF);
  prepararAba_(planilha, ABA_TAREFAS, COL_TAREFAS);

  // Remove a aba vazia que vem com toda planilha nova
  ['Página1', 'Sheet1', 'Página 1'].forEach(function (nome) {
    const aba = planilha.getSheetByName(nome);
    if (aba && aba.getLastRow() === 0 && planilha.getSheets().length > 2) planilha.deleteSheet(aba);
  });

  Logger.log('Planilha pronta. Agora siga para o passo 6 (Implantar).');
}


/** Abrir o endereço do App da Web no navegador mostra esta mensagem. */
function doGet() {
  return saida_({ ok: true, mensagem: 'Painel da conferência funcionando.' });
}


/** Recebe os pedidos da página conferencia.html. */
function doPost(e) {
  let pedido;
  try {
    pedido = JSON.parse(e.postData.contents);
  } catch (erro) {
    return saida_({ ok: false, erro: 'Pedido inválido.' });
  }

  if (String(pedido.codigo || '') !== CODIGO_ACESSO) {
    return saida_({ ok: false, codigo: 'acesso', erro: 'Código de acesso incorreto.' });
  }

  const trava = LockService.getScriptLock();
  if (!trava.tryLock(20000)) {
    return saida_({ ok: false, codigo: 'ocupada', erro: 'A planilha está ocupada. Tente de novo.' });
  }

  try {
    const acoes = {
      listar: listar_,
      criarConferencia: criarConferencia_,
      editarConferencia: editarConferencia_,
      notas: notas_,
      marcar: marcar_,
      observar: observar_
    };
    const acao = acoes[pedido.acao];
    if (!acao) return saida_({ ok: false, erro: 'Ação desconhecida.' });
    return saida_(Object.assign({ ok: true }, acao(pedido) || {}));
  } catch (erro) {
    return saida_({ ok: false, erro: 'Erro na planilha: ' + erro.message });
  } finally {
    trava.releaseLock();
  }
}


/* ---------------- Ações ---------------- */

function listar_() {
  return {
    conferencias: lerTabela_(aba_(ABA_CONF, COL_CONF), COL_CONF),
    tarefas: lerTabela_(aba_(ABA_TAREFAS, COL_TAREFAS), COL_TAREFAS)
  };
}

function criarConferencia_(p) {
  const id = limitar_(p.id, 40);
  const nome = limitar_(p.nome, 80);
  const sabado = String(p.sabado || '');
  if (!id || !nome || !/^\d{4}-\d{2}-\d{2}$/.test(sabado)) throw new Error('dados da conferência incompletos');
  const aba = aba_(ABA_CONF, COL_CONF);
  // Se a mesma conferência chegar duas vezes (internet instável), não duplica
  if (acharLinha_(aba, COL_CONF, { id: id }) > 0) return {};
  salvar_(aba, COL_CONF, { id: id }, {
    nome: nome, sabado: sabado,
    criado_por: limitar_(p.por, 80), criado_em: agora_()
  });
  return {};
}

function editarConferencia_(p) {
  const id = limitar_(p.id, 40);
  const nome = limitar_(p.nome, 80);
  const sabado = String(p.sabado || '');
  if (!id || !nome || !/^\d{4}-\d{2}-\d{2}$/.test(sabado)) throw new Error('dados da conferência incompletos');
  const aba = aba_(ABA_CONF, COL_CONF);
  if (acharLinha_(aba, COL_CONF, { id: id }) < 0) throw new Error('conferência não encontrada');
  salvar_(aba, COL_CONF, { id: id }, { nome: nome, sabado: sabado });
  return {};
}

function notas_(p) {
  const id = limitar_(p.id, 40);
  const aba = aba_(ABA_CONF, COL_CONF);
  if (!id || acharLinha_(aba, COL_CONF, { id: id }) < 0) throw new Error('conferência não encontrada');
  salvar_(aba, COL_CONF, { id: id }, {
    notas: limitar_(p.notas, 10000), notas_por: limitar_(p.por, 80), notas_em: agora_()
  });
  return {};
}

function marcar_(p) {
  const chave = { conferencia: limitar_(p.conferencia, 40), tarefa: limitar_(p.tarefa, 60) };
  if (!chave.conferencia || !chave.tarefa) throw new Error('tarefa não informada');
  const feito = p.feito === true;
  salvar_(aba_(ABA_TAREFAS, COL_TAREFAS), COL_TAREFAS, chave, {
    feito: feito ? 'sim' : 'nao',
    feito_por: feito ? limitar_(p.por, 80) : '',
    feito_em: feito ? agora_() : ''
  });
  return {};
}

function observar_(p) {
  const chave = { conferencia: limitar_(p.conferencia, 40), tarefa: limitar_(p.tarefa, 60) };
  if (!chave.conferencia || !chave.tarefa) throw new Error('tarefa não informada');
  salvar_(aba_(ABA_TAREFAS, COL_TAREFAS), COL_TAREFAS, chave, {
    observacao: limitar_(p.observacao, 2000), obs_por: limitar_(p.por, 80), obs_em: agora_()
  });
  return {};
}


/* ---------------- Planilha ---------------- */

function prepararAba_(planilha, nome, colunas) {
  const aba = planilha.getSheetByName(nome) || planilha.insertSheet(nome);
  aba.getRange(1, 1, aba.getMaxRows(), colunas.length).setNumberFormat('@');
  aba.getRange(1, 1, 1, colunas.length)
    .setValues([colunas])
    .setFontWeight('bold')
    .setBackground('#1B3A5C')
    .setFontColor('#FFFFFF');
  aba.setFrozenRows(1);
  return aba;
}

function aba_(nome, colunas) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  return planilha.getSheetByName(nome) || prepararAba_(planilha, nome, colunas);
}

function lerTabela_(aba, colunas) {
  const valores = aba.getDataRange().getValues();
  const linhas = [];
  for (let i = 1; i < valores.length; i++) {
    const linha = valores[i];
    if (!linha.some(function (v) { return v !== '' && v != null; })) continue;
    const obj = {};
    colunas.forEach(function (col, j) { obj[col] = texto_(linha[j]); });
    linhas.push(obj);
  }
  return linhas;
}

function acharLinha_(aba, colunas, chave) {
  const valores = aba.getDataRange().getValues();
  const campos = Object.keys(chave);
  for (let i = 1; i < valores.length; i++) {
    const bate = campos.every(function (campo) {
      return texto_(valores[i][colunas.indexOf(campo)]) === chave[campo];
    });
    if (bate) return i + 1;
  }
  return -1;
}

/** Atualiza a linha que bate com a chave, ou cria uma nova. */
function salvar_(aba, colunas, chave, mudancas) {
  const linha = acharLinha_(aba, colunas, chave);
  const atual = {};
  if (linha > 0) {
    const valores = aba.getRange(linha, 1, 1, colunas.length).getValues()[0];
    colunas.forEach(function (col, j) { atual[col] = texto_(valores[j]); });
  } else {
    colunas.forEach(function (col) { atual[col] = ''; });
    Object.keys(chave).forEach(function (campo) { atual[campo] = chave[campo]; });
  }
  Object.keys(mudancas).forEach(function (campo) { atual[campo] = mudancas[campo]; });
  const nova = colunas.map(function (col) { return celula_(atual[col]); });
  if (linha > 0) aba.getRange(linha, 1, 1, colunas.length).setValues([nova]);
  else aba.appendRow(nova);
}


/* ---------------- Utilidades ---------------- */

/** O apóstrofo faz a planilha guardar como texto, sem virar data ou fórmula. */
function celula_(valor) {
  const s = valor == null ? '' : String(valor);
  return s === '' ? '' : "'" + s;
}

function texto_(valor) {
  if (valor instanceof Date) {
    const temHora = valor.getHours() || valor.getMinutes();
    return Utilities.formatDate(valor, FUSO, temHora ? 'dd/MM/yyyy HH:mm' : 'yyyy-MM-dd');
  }
  return valor == null ? '' : String(valor);
}

function limitar_(valor, tamanho) {
  return String(valor == null ? '' : valor).trim().slice(0, tamanho);
}

function agora_() {
  return Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm');
}

function saida_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
