
import { jsPDF } from 'jspdf';

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

export async function imprimirPlanilha(planilha) {
  if (!planilha) {
    throw new Error('Nenhuma planilha selecionada.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const margem = 15;
  const largura = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const larguraUtil = largura - margem * 2;

  const nome = planilha.nome || 'Planilha';
  const colunas = planilha.colunas || [];
  const linhas = planilha.linhas || [];
  const obs = String(planilha.obs || '').trim();

  const dataImpressao = new Date().toLocaleString('pt-BR');

  
  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 35, 63);
  doc.text('ERICK ELETRICISTA', margem, 18);

  // Telefone abaixo do nome
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 100, 115);
  doc.text('Telefone: (31)971317822', margem, 24);

  // Nome do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(20, 35, 63);
  const nomeLinhas = doc.splitTextToSize(nome, largura - 95);
  doc.text(nomeLinhas, margem, 33);

  // Data de impressão
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text(`Data de impressão: ${dataImpressao}`, margem, 41);


  // Logo à direita
  try {
    const logo = await carregarLogo();
    doc.addImage(logo, 'PNG', largura - 65, 8, 50, 25);
  } catch (erro) {
    console.warn('PDF gerado sem logo:', erro);
  }

  doc.setDrawColor(160);
  doc.line(margem, 42, largura - margem, 42);

  let y = 48;

  if (!colunas.length) {
    doc.setFontSize(11);
    doc.text('Esta planilha não possui colunas.', margem, y);
  } else {
    const alturaCabecalho = 10;
    const alturaLinha = 9;
    const larguraColuna = larguraUtil / colunas.length;

    function desenharCabecalho() {
      doc.setFillColor(235, 239, 245);
      doc.rect(margem, y, larguraUtil, alturaCabecalho, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);

      colunas.forEach((coluna, index) => {
        const x = margem + index * larguraColuna + 2;
        const texto = doc.splitTextToSize(
          String(coluna.nome || ''),
          larguraColuna - 4
        );

        doc.text(texto[0] || '', x, y + 6.5);
      });

      doc.setDrawColor(180);
      doc.rect(margem, y, larguraUtil, alturaCabecalho);

      for (let i = 1; i < colunas.length; i++) {
        const x = margem + i * larguraColuna;
        doc.line(x, y, x, y + alturaCabecalho);
      }

      y += alturaCabecalho;
    }

    desenharCabecalho();

    linhas.forEach((linha, indice) => {
      if (y + alturaLinha > alturaPagina - 15) {
        doc.addPage();
        y = 15;
        desenharCabecalho();
      }

      if (indice % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margem, y, larguraUtil, alturaLinha, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(35, 35, 35);

      colunas.forEach((coluna, index) => {
        const x = margem + index * larguraColuna + 2;
        const valor = String(linha[coluna.id] ?? '');

        const texto = doc.splitTextToSize(
          valor,
          larguraColuna - 4
        );

        doc.text(texto[0] || '', x, y + 5.8);
      });

      doc.setDrawColor(210);
      doc.rect(margem, y, larguraUtil, alturaLinha);

      for (let i = 1; i < colunas.length; i++) {
        const x = margem + i * larguraColuna;
        doc.line(x, y, x, y + alturaLinha);
      }

      y += alturaLinha;
    });
  }

  
  // Imprimir observações abaixo da tabela
  if (obs) {
    const espacamento = 6;
    const larguraObs = larguraUtil - 4;
    const alturaLinhaObs = 5;

    const textoObs = doc.splitTextToSize(
      obs,
      larguraObs
    );

    // Espaço antes das observações
    y += espacamento;

    // Verificar se há espaço para o título
    if (y + 10 > alturaPagina - 15) {
      doc.addPage();
      y = 15;
    }

    // Título das observações
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 35, 63);
    doc.text('Observações:', margem, y + 4);

    y += 8;

    // Imprimir todas as linhas do texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(35, 35, 35);

    textoObs.forEach(linha => {
      if (y + alturaLinhaObs > alturaPagina - 15) {
        doc.addPage();
        y = 15;
      }

      doc.text(linha, margem, y);
      y += alturaLinhaObs;
    });
  }


  const nomeArquivo = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-');

  doc.save(`planilha-${nomeArquivo || 'sem-nome'}.pdf`);
}
