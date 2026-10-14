
import { jsPDF } from 'jspdf';

const moeda = valor =>
  Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

const formatarData = data => {
  if (!data) return '-';
  const partes = String(data).split('-');
  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : data;
};


async function carregarLogo() {
  const url = `${import.meta.env.BASE_URL}logo-erick.png`;

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar a logo.');
  }

  const blob = await resposta.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


export async function baixarOrdemPdf(ordem, clientes = []) {
  const doc = new jsPDF();
  const margem = 15;
  const larguraPagina = doc.internal.pageSize.getWidth();
  const limite = doc.internal.pageSize.getHeight() - 20;
  let y = 10;

  function verificarPagina(altura = 10) {
    if (y + altura > limite) {
      doc.addPage();
      y = 20;
    }
  }

  function escrever(texto, tamanho = 10, negrito = false) {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(tamanho);
    doc.setTextColor(20, 20, 20);

    const linhas = doc.splitTextToSize(
      String(texto ?? ''),
      larguraPagina - margem * 2
    );

    verificarPagina(linhas.length * 5 + 4);

    doc.text(linhas, margem, y);
    y += linhas.length * 5 + 4;
  }

  
    // CABEÇALHO COM LOGO À DIREITA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ERICK ELETRICISTA', 15, y + 8);

    doc.setFontSize(13);
    doc.text('ORDEM DE SERVIÇO', 15, y + 19);

    try {
    const logo = await carregarLogo();

    // Posição: x=130, y=17
    // Dimensões: 60 x 25 mm
    doc.addImage(logo, 'PNG', 130, 7, 60, 25);
    } catch (erro) {
    console.warn('PDF gerado sem logo:', erro);
    }

    y = 40;

    doc.setDrawColor(120);
    doc.line(15, y, 195, y);
    y += 6;


  
  const cliente = clientes.find(
    c => c.nome === ordem.cliente
  );

  // Duas colunas: cliente à esquerda e ordem à direita
  const colunaEsquerda = margem;
  const colunaDireita = 120;
  const larguraColuna = 78;
  const alturaLinha = 7;

  let yEsquerda = y;
  let yDireita = y;

  // Títulos das colunas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);

  doc.text('DADOS DO CLIENTE', colunaEsquerda, yEsquerda);
  doc.text('DADOS DA ORDEM', colunaDireita, yDireita);

  yEsquerda += 9;
  yDireita += 9;

  // Função para escrever dentro de cada coluna
  function escreverColuna(texto, x, yAtual, largura) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const linhas = doc.splitTextToSize(
      String(texto ?? '-'),
      largura
    );

    doc.text(linhas, x, yAtual);

    return yAtual + linhas.length * 5 + 3;
  }

  // Coluna esquerda: dados do cliente
  yEsquerda = escreverColuna(
    `Nome: ${ordem.cliente || '-'}`,
    colunaEsquerda,
    yEsquerda,
    larguraColuna
  );

  if (cliente?.telefone) {
    yEsquerda = escreverColuna(
      `Telefone: ${cliente.telefone}`,
      colunaEsquerda,
      yEsquerda,
      larguraColuna
    );
  }

  if (cliente?.email) {
    yEsquerda = escreverColuna(
      `E-mail: ${cliente.email}`,
      colunaEsquerda,
      yEsquerda,
      larguraColuna
    );
  }

  if (cliente?.endereco) {
    yEsquerda = escreverColuna(
      `Endereço: ${cliente.endereco}`,
      colunaEsquerda,
      yEsquerda,
      larguraColuna
    );
  }

  // Coluna direita: dados da ordem
  yDireita = escreverColuna(
    `Número: ${ordem.id || '-'}`,
    colunaDireita,
    yDireita,
    larguraColuna
  );

  yDireita = escreverColuna(
    `Data: ${formatarData(ordem.data)}`,
    colunaDireita,
    yDireita,
    larguraColuna
  );

  yDireita = escreverColuna(
    `Status: ${ordem.status || '-'}`,
    colunaDireita,
    yDireita,
    larguraColuna
  );

  // Continua abaixo da coluna que ocupou mais espaço
  y = Math.max(yEsquerda, yDireita) + 3;


  y += 5;
  escrever('SERVIÇOS', 12, true);

  const itens =
    Array.isArray(ordem.servicos) && ordem.servicos.length
      ? ordem.servicos
      : [{
          nome: ordem.servico || 'Serviço não informado',
          quantidade: 1,
          preco: Number(ordem.valor) || 0
        }];

  // Larguras das colunas em milímetros
  const colunas = [15, 94, 114, 149, 195];

  function cabecalhoTabela() {
    verificarPagina(12);

    doc.setFillColor(235, 239, 245);
    doc.rect(margem, y, 180, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);

    doc.text('Serviço', 18, y + 6.5);
    doc.text('Qtd.', 104, y + 6.5, { align: 'center' });
    doc.text('Unitário', 146, y + 6.5, { align: 'right' });
    doc.text('Subtotal', 192, y + 6.5, { align: 'right' });

    doc.setDrawColor(180);
    doc.rect(margem, y, 180, 10);
    y += 10;
  }

  cabecalhoTabela();

  let total = 0;

  itens.forEach((item, index) => {
    const quantidade = Number(item.quantidade) || 0;
    const preco = Number(item.preco) || 0;
    const subtotal = quantidade * preco;
    total += subtotal;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const linhas = doc.splitTextToSize(
      String(item.nome || '-'),
      73
    );

    
    const altura = Math.max(7, linhas.length * 4 + 2);


    if (y + altura > limite) {
      doc.addPage();
      y = 20;
      cabecalhoTabela();
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margem, y, 180, altura, 'F');
    }

    doc.setTextColor(20, 20, 20);
    doc.text(linhas, 18, y + 4.5);
    doc.text(String(quantidade), 104, y + 6, {
      align: 'center'
    });
    doc.text(moeda(preco), 146, y + 6, {
      align: 'right'
    });
    doc.text(moeda(subtotal), 192, y + 6, {
      align: 'right'
    });

    doc.setDrawColor(210);
    doc.rect(margem, y, 180, altura);

    y += altura;
  });

  
  const percentualDesconto = Math.min(
    100,
    Math.max(0, Number(ordem.desconto) || 0)
  );

  const valorDesconto =
    ordem.valorDesconto != null
      ? Number(ordem.valorDesconto) || 0
      : total * percentualDesconto / 100;

  const valorFinal =
    ordem.valor != null && ordem.valor !== ''
      ? Number(ordem.valor) || 0
      : Math.max(0, total - valorDesconto);

  verificarPagina(38);

  // Subtotal dos serviços
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);

  doc.text(
    `Subtotal: ${moeda(total)}`,
    192,
    y + 6,
    { align: 'right' }
  );

  // Desconto percentual
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(
    `Desconto (${percentualDesconto}%): - ${moeda(valorDesconto)}`,
    192,
    y + 14,
    { align: 'right' }
  );

  y += 18;

  // Total final destacado
  doc.setFillColor(225, 233, 243);
  doc.rect(margem, y, 180, 13, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);

  doc.text(
    `VALOR TOTAL: ${moeda(valorFinal)}`,
    192,
    y + 8.5,
    { align: 'right' }
  );

  y += 35;


  // ASSINATURAS
  verificarPagina(20);

  doc.setDrawColor(100);
  doc.line(20, y, 90, y);
  doc.line(115, y, 185, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Assinatura do cliente', 20, y);
  doc.text('Responsável técnico', 115, y);

  const nomeArquivo = `ordem-servico-${String(
    ordem.id || 'sem-numero'
  ).replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

  doc.save(nomeArquivo);
}
