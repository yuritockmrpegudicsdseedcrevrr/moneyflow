let entradas = [], custos = [], historico = [], grafico = null, progresso = 0;

function atualizarProgresso(etapa) {
  progresso = Math.min(100, progresso + etapa);
  document.getElementById("progresso-bar").style.width = progresso + "%";
}

function adicionarEntrada() {
  const id = entradas.length;
  const div = document.createElement("div");
  div.innerHTML = `
    <input type='text' id='entradaNome${id}' placeholder='Nome da entrada'>
    <input type='number' id='entradaValor${id}' placeholder='Valor (R$)'>
  `;
  entradas.push(div);
  document.getElementById("entradasContainer").appendChild(div);
  atualizarProgresso(10);
}

function adicionarCusto() {
  const id = custos.length;
  const div = document.createElement("div");
  div.innerHTML = `
    <input type='text' id='nome${id}' placeholder='Nome do custo'>
    <input type='number' id='valor${id}' placeholder='Valor (R$)'>
  `;
  custos.push(div);
  document.getElementById("custosContainer").appendChild(div);
  atualizarProgresso(10);
}

function calcularResultado() {
  let receita = 0;
  entradas.forEach((_, i) => {
    const val = parseFloat(document.getElementById(`entradaValor${i}`).value);
    if (!isNaN(val)) receita += val;
  });
  if (receita <= 0) { mostrarPopup("Informe pelo menos uma entrada válida!", "erro"); return; }

  let totalCustos = 0;
  custos.forEach((_, i) => {
    const val = parseFloat(document.getElementById(`valor${i}`).value);
    if (!isNaN(val)) totalCustos += val;
  });

  const sobra = receita - totalCustos;
  const percLucro = (sobra / receita) * 100;
  historico.push({ receita, totalCustos, sobra });
  const media = historico.reduce((a, b) => a + b.sobra, 0) / historico.length;

  document.getElementById("resultado").innerHTML = `
    <div class='resultado'>
      <h3>Resumo</h3>
      <p><strong>Receita total:</strong> R$ ${receita.toFixed(2)}</p>
      <p><strong>Custos:</strong> R$ ${totalCustos.toFixed(2)}</p>
      <p><strong>Lucro/Prejuízo:</strong> R$ ${sobra.toFixed(2)} (${percLucro.toFixed(2)}%)</p>
      <p><strong>Média do período:</strong> R$ ${media.toFixed(2)}</p>
    </div>`;
  atualizarGrafico();
  atualizarProgresso(20);
  mostrarPopup("Cálculo concluído!", "info");
}

function iniciarNovoMes() {
  entradas = [];
  custos = [];
  progresso = 0;
  document.getElementById("entradasContainer").innerHTML = "";
  document.getElementById("custosContainer").innerHTML = "";
  document.getElementById("progresso-bar").style.width = "0%";
  document.getElementById("resultado").innerHTML = "";
  if (grafico) grafico.destroy();
  mostrarPopup("Novo mês iniciado!", "info");
}

function carregarEmpresa() {
  iniciarNovoMes();
  const opcoes = [
    { nome: "Vida normal", receita: 1412, entradas: ["Salário"], custos: ["Aluguel", "Alimentação", "Transporte", "Energia", "Internet"] },
    { nome: "Lava-rápido", receita: 8000, entradas: ["Serviços"], custos: ["Água", "Sabão", "Energia", "Mão de obra", "Equipamentos"] },
    { nome: "Lanchonete", receita: 15000, entradas: ["Vendas"], custos: ["Aluguel", "Ingredientes", "Funcionários", "Energia", "Marketing"] }
  ];

  let nomes = opcoes.map((o, i) => `${i + 1}. ${o.nome}`).join("\n");
  let escolha = prompt("Escolha uma empresa:\n" + nomes);
  const index = parseInt(escolha) - 1;
  if (isNaN(index) || index < 0 || index >= opcoes.length) { mostrarPopup("Opção inválida", "erro"); return; }
  const empresa = opcoes[index];

  empresa.entradas.forEach((e, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<input type='text' id='entradaNome${i}' value='${e}'><input type='number' id='entradaValor${i}' value='${empresa.receita}'>`;
    entradas.push(div);
    document.getElementById("entradasContainer").appendChild(div);
  });

  empresa.custos.forEach((c, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<input type='text' id='nome${i}' value='${c}' placeholder='Valor (R$)'>`;
    custos.push(div);
    document.getElementById("custosContainer").appendChild(div);
  });
  mostrarPopup(`Empresa '${empresa.nome}' carregada`, "info");
  atualizarProgresso(15);
}

function atualizarGrafico() {
  const ctx = document.getElementById("grafico").getContext("2d");
  if (grafico) grafico.destroy();
  const labels = historico.map((_, i) => "Mês " + (i + 1));
  const receitas = historico.map(h => h.receita);
  const custosTotais = historico.map(h => h.totalCustos);
  const lucros = historico.map(h => h.sobra);

  grafico = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Receita', data: receitas, borderColor: 'rgba(0,123,255,0.8)', backgroundColor: 'rgba(0,123,255,0.2)', fill: true },
        { label: 'Custos', data: custosTotais, borderColor: 'rgba(220,53,69,0.8)', backgroundColor: 'rgba(220,53,69,0.2)', fill: true },
        { label: 'Lucro', data: lucros, borderColor: 'rgba(40,167,69,0.8)', backgroundColor: 'rgba(40,167,69,0.2)', fill: true }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
  });
}

function mostrarPopup(texto, tipo) {
  const popup = document.getElementById("popup");
  popup.style.background = tipo === 'erro' ? '#dc3545' : '#17a2b8';
  popup.textContent = texto;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2500);
}

function salvarFluxo() {
  const blob = new Blob([JSON.stringify(historico)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fluxo_caixa.fc";
  a.click();
  URL.revokeObjectURL(url);
  mostrarPopup("Fluxo salvo com sucesso", "info");
}

function carregarFluxo(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      historico = JSON.parse(e.target.result);
      atualizarGrafico();
      mostrarPopup("Fluxo carregado com sucesso", "info");
    } catch {
      mostrarPopup("Arquivo inválido", "erro");
    }
  };
  reader.readAsText(file);
}

function mostrarAjuda() {
  alert("Como usar:\n1. Adicione suas entradas e custos.\n2. Clique em Calcular.\n3. Veja o resumo e gráfico.\n4. Use 'Carregar exemplo' ou 'Salvar' para gerenciar dados.");
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registrado!'));
}
