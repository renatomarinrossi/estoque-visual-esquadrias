// Converte o formato em que a folha ainda estava vinculada a contas_pagar.
// Usa o backup atual apenas para reservar IDs livres e reconhecer períodos já existentes.
type Linha = Record<string, unknown>;
export function converterBackupV3(arquivo: Record<string, unknown>, atual: Record<string, unknown>) {
  const lista = (obj: Record<string, unknown>, chave: string): Linha[] => {
    const valor = obj[chave];
    if (!Array.isArray(valor) || valor.some(v => !v || typeof v !== "object" || Array.isArray(v))) throw new Error(`Seção inválida no formato 3: ${chave}.`);
    return valor as Linha[];
  };
  const funcionarios = lista(arquivo,"dp_funcionarios");
  const contas = lista(arquivo,"contas_pagar");
  const pagamentos = lista(arquivo,"dp_pagamentos");
  const ferias = lista(arquivo,"dp_ferias");
  const periodosAtuais = lista(atual,"dp_periodos_ferias");
  const feriasAtuais = lista(atual,"dp_ferias");
  const pagamentosAtuais = lista(atual,"dp_ferias_pagamentos");
  let proximoPeriodo = Math.max(0,...periodosAtuais.map(p=>Number(p.id)))+1;
  let proximoPagamento = Math.max(0,...pagamentosAtuais.map(p=>Number(p.id)))+1;
  const periodos: Linha[]=[];
  const baixas: Linha[]=[];
  const vinculadas = new Set(pagamentos.map(p=>Number(p.conta_pagar_id)));
  const aniversario = (admissao: string, anos: number) => {
    const [ano,mes,dia]=admissao.split("-").map(Number);
    const ultimo=new Date(Date.UTC(ano+anos,mes,0)).getUTCDate();
    return new Date(Date.UTC(ano+anos,mes-1,Math.min(dia,ultimo))).toISOString().slice(0,10);
  };
  const anterior = (data: string)=>new Date(Date.parse(data+"T12:00:00Z")-86400000).toISOString().slice(0,10);
  const folha = pagamentos.map(p=>{
    const c=contas.find(c=>Number(c.id)===Number(p.conta_pagar_id));
    if(!c)throw new Error(`A folha #${p.id} não contém sua conta vinculada.`);
    const resultado={...p,valor:c.valor,forma_pagamento:c.forma_pagamento,data_vencimento:c.data_vencimento,data_pagamento:c.data_pagamento??null,status:c.status,valor_extra:0,observacoes_extra:""};
    delete (resultado as Linha).conta_pagar_id;
    return resultado;
  });
  const concessoes=ferias.map(f=>{
    const funcionario=funcionarios.find(p=>Number(p.id)===Number(f.funcionario_id));
    if(!funcionario)throw new Error(`Funcionário das férias #${f.id} ausente.`);
    const admissao=String(funcionario.data_admissao), inicio=String(f.inicio);
    let anos=Number(inicio.slice(0,4))-Number(admissao.slice(0,4));
    if(aniversario(admissao,anos)>inicio)anos--;
    if(anos<1)throw new Error(`Férias #${f.id} anteriores ao primeiro período adquirido. Revise o vínculo antes da conversão.`);
    const aquisitivo=aniversario(admissao,anos-1), direito=aniversario(admissao,anos);
    let periodo=[...periodosAtuais,...periodos].find(p=>Number(p.funcionario_id)===Number(f.funcionario_id)&&p.periodo_aquisitivo_inicio===aquisitivo);
    if(!periodo){periodo={id:proximoPeriodo++,funcionario_id:f.funcionario_id,periodo_aquisitivo_inicio:aquisitivo,periodo_aquisitivo_fim:anterior(direito),data_direito:direito,limite_concessao:anterior(aniversario(admissao,anos+1)),dias_direito:30};}
    if(!periodos.some(p=>p.id===periodo.id))periodos.push(periodo);
    const dias=Math.round((Date.parse(String(f.fim)+"T12:00:00Z")-Date.parse(inicio+"T12:00:00Z"))/86400000)+1;
    if(dias<1||dias>30)throw new Error(`Duração inválida das férias #${f.id}.`);
    if(f.status==="PAGO"&&!feriasAtuais.some(a=>Number(a.id)===Number(f.id))){
      if(!f.data_pagamento)throw new Error(`Data da baixa das férias #${f.id} ausente.`);
      baixas.push({id:proximoPagamento++,ferias_id:f.id,componente:"FERIAS",valor:f.valor,data_pagamento:f.data_pagamento,forma_pagamento:"PIX",observacoes:"Baixa convertida do formato 3; forma PIX utilizada pela migração histórica do sistema.",idempotencia:crypto.randomUUID()});
    }
    const resultado={...f,periodo_id:periodo.id,valor_ferias:f.valor,valor_terco:0,valor_abono:0,dias_gozo:dias,abono_dias:0,data_prevista_terco:null,data_prevista_abono:null};
    delete (resultado as Linha).valor;
    return resultado;
  });
  return {...arquivo,backupVersion:4,origemVersao:3,contas_pagar:contas.filter(c=>!vinculadas.has(Number(c.id))),dp_pagamentos:folha,dp_periodos_ferias:periodos,dp_ferias:concessoes,dp_ferias_pagamentos:baixas};
}
