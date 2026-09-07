// Fixture de interface: todas as consultas e gravações são simuladas localmente.
// Não é um ponto de entrada do build de produção.
import React from 'react';
import {createRoot} from 'react-dom/client';
import '../src/index.css';
import {supabase} from '../src/services/supabase';
import DepartamentoPessoal from '../src/pages/DepartamentoPessoal/DepartamentoPessoal';
if(!import.meta.env.DEV)throw new Error('Fixture permitida somente em desenvolvimento.');
const hoje=new Date().toISOString().slice(0,10), comp=hoje.slice(0,7)+'-01';
const funcionario={id:1,nome:'Funcionário de teste',funcao:'Montador',salario:3000,data_admissao:'2023-01-01',data_inativacao:null,data_aviso_ferias:null,ativo:true,observacoes:''};
const tabelas={
 dp_funcionarios:[funcionario],
 dp_pagamentos:[{id:1,funcionario_id:1,competencia:comp,tipo:'SALARIO',nome_funcionario:funcionario.nome,funcao_funcionario:funcionario.funcao,salario_base:3000,valor:1800,valor_extra:-100,observacoes_extra:'Desconto anterior',forma_pagamento:'PIX',data_vencimento:hoje,data_pagamento:null,status:'EM_ABERTO'}],
 dp_periodos_ferias:[{id:1,funcionario_id:1,periodo_aquisitivo_inicio:'2024-01-01',periodo_aquisitivo_fim:'2024-12-31',data_direito:'2025-01-01',limite_concessao:'2025-12-31',dias_direito:30}],
 dp_ferias_movimentacoes:[{id:1,periodo_id:1,funcionario_id:1,descricao:'Gozo demonstrativo',tipo_movimentacao:'GOZO',quantidade_dias:10,valor:0,data_movimentacao:hoje,observacoes:'',cancelado_em:null},{id:2,periodo_id:1,funcionario_id:1,descricao:'Pagamento dos mesmos 10 dias',tipo_movimentacao:'PAGAMENTO_FERIAS',quantidade_dias:0,valor:1000,data_movimentacao:hoje,observacoes:'',cancelado_em:null}],
 dp_feriados:[{id:1,data:'2026-05-22',descricao:'Aniversário de Fernandópolis',abrangencia:'MUNICIPAL'}],
 dp_auditoria:[],dp_ferias:[],dp_pagamento_lancamentos:[],
};
supabase.from=(t)=>{
 const query={then:(resolve)=>Promise.resolve({data:tabelas[t]??[],error:null}).then(resolve)};
 for(const m of ['select','order','range','eq','gte','lte','is','in','limit','insert','delete','update'])query[m]=()=>query;
 return query;
};
supabase.rpc=async(nome,args)=>{
 document.getElementById('resultado').textContent+='\n'+JSON.stringify({rpc:nome,args:args??{}},null,2);
 return {data:nome==='dp_gerar_folha'?0:null,error:null};
};
createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-slate-50 p-6"><p className="mb-4 rounded bg-amber-100 p-3">Teste local com dados fictícios. Nenhuma operação chega ao Supabase.</p><DepartamentoPessoal/><pre id="resultado" className="mt-8 overflow-auto rounded bg-slate-200 p-4"/></main>);
