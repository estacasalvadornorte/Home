/* ═══════════════════════════════════════════════════════════════════════
   LEITOR DE CSV
   Usado pela página de liderança e pelo editor.
   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   ═══════════════════════════════════════════════════════════════════════ */

// Divide uma linha de CSV respeitando textos entre aspas
function csvDividirLinha(linha) {
  const campos = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (c === ',' && !dentroDeAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map(function (x) { return x.trim(); });
}

// Transforma o texto do CSV em uma lista de objetos
function csvLer(texto) {
  const linhas = texto.replace(/\r/g, '').split('\n').filter(function (l) {
    return l.trim() !== '';
  });
  if (linhas.length < 2) return [];

  const cabecalho = csvDividirLinha(linhas[0]).map(function (h) {
    return h.toLowerCase();
  });

  const registros = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = csvDividirLinha(linhas[i]);
    const obj = {};
    cabecalho.forEach(function (coluna, idx) {
      obj[coluna] = campos[idx] || '';
    });
    registros.push(obj);
  }
  return registros;
}

// Monta de volta o texto de um CSV a partir de uma lista de objetos
function csvEscrever(colunas, registros) {
  const proteger = function (valor) {
    valor = (valor === undefined || valor === null) ? '' : String(valor);
    if (valor.indexOf(',') !== -1 || valor.indexOf('"') !== -1) {
      return '"' + valor.replace(/"/g, '""') + '"';
    }
    return valor;
  };

  const linhas = [colunas.join(',')];
  registros.forEach(function (r) {
    linhas.push(colunas.map(function (c) { return proteger(r[c]); }).join(','));
  });
  return linhas.join('\n') + '\n';
}

// Aceita 15/03/2026 e também 2026-03-15. Rejeita datas que não existem.
function csvData(texto) {
  if (!texto) return null;
  texto = texto.trim();

  let dia, mes, ano;
  let m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    dia = +m[1]; mes = +m[2]; ano = +m[3];
  } else {
    m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    ano = +m[1]; mes = +m[2]; dia = +m[3];
  }

  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return null;
  }
  return d;
}
