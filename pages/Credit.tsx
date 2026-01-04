
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/supabaseMock';
import { Installment, Customer } from '../types';

const Credit: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'pending' | 'paid'>('pending');

  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [manualAmount, setManualAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inst, cust] = await Promise.all([db.getInstallments(), db.getCustomers()]);
      setInstallments(inst);
      setCustomers(cust);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calcula o débito total de cada cliente (soma de todas as parcelas pending)
  const customerDebts = useMemo(() => {
    const debts: Record<string, number> = {};
    installments.forEach(inst => {
      if (inst.status === 'pending') {
        debts[inst.customer_id] = (debts[inst.customer_id] || 0) + inst.value;
      }
    });
    return debts;
  }, [installments]);

  const filtered = useMemo(() => {
    return installments.filter(i => {
      if (tab === 'pending' && i.status === 'paid') return false;
      if (tab === 'paid' && i.status !== 'paid') return false;

      const customer = customers.find(c => c.id === i.customer_id);
      return customer?.name.toLowerCase().includes(search.toLowerCase()) || customer?.phone.includes(search);
    }).sort((a, b) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [installments, search, customers, tab]);

  const handlePay = async (id: string, value: number, isManual = false) => {
    if (value <= 0) return alert('Por favor, insira um valor válido.');
    
    const inst = installments.find(i => i.id === id);
    if (!inst) return;

    if (!isManual && !confirm(`Confirmar recebimento integral de ${formatCurrency(value)}?`)) return;
    
    setIsProcessing(true);
    try {
      const result = await db.payInstallment(id, value);
      await loadData();
      
      if (isManual) {
        if (result.installmentsProcessed > 1) {
          alert(`Excelente! O valor de ${formatCurrency(value)} quitou/abateu ${result.installmentsProcessed} parcelas deste cliente.`);
        } else {
          alert('Recebimento registrado com sucesso!');
        }
      } else {
        alert('Pagamento registrado!');
      }
      
      setSelectedInstallment(null);
      setManualAmount('');
    } catch (err: any) {
      console.error('Erro ao processar:', err);
      alert(`Erro: ${err.message || 'Falha na conexão'}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openManualModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setManualAmount(inst.value.toFixed(2));
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const selectedCustomerTotalDebt = selectedInstallment ? (customerDebts[selectedInstallment.customer_id] || 0) : 0;
  const isOverpaying = selectedInstallment && parseFloat(manualAmount) > selectedInstallment.value;
  const isOverpayingTotal = selectedInstallment && parseFloat(manualAmount) > selectedCustomerTotalDebt;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#4a1d35] tracking-tight">Gestão de Crediário</h1>
            <p className="text-sm text-gray-500">Controle de recebimentos e abatimentos em cascata.</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setTab('pending')} 
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${tab === 'pending' ? 'bg-[#ee2b6c] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              EM ABERTO
            </button>
            <button 
              onClick={() => setTab('paid')} 
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${tab === 'paid' ? 'bg-[#4a1d96] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              PAGAS
            </button>
          </div>
        </header>

        {/* Modal de Pagamento */}
        {selectedInstallment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-[#4a1d35] p-5 text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">payments</span>
                  Recebimento Manual
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Cliente</p>
                  <p className="font-extrabold text-gray-900 text-lg">{customers.find(c => c.id === selectedInstallment.customer_id)?.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-pink-50 rounded-2xl border border-pink-100">
                    <p className="text-[9px] text-pink-400 font-black uppercase mb-0.5">Esta Parcela</p>
                    <p className="text-sm font-black text-[#ee2b6c]">{formatCurrency(selectedInstallment.value)}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-[9px] text-purple-400 font-black uppercase mb-0.5">Total Devedor</p>
                    <p className="text-sm font-black text-[#4a1d96]">{formatCurrency(selectedCustomerTotalDebt)}</p>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] text-gray-500 font-black uppercase mb-1.5 tracking-widest">Valor do Recebimento (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 text-xl font-black focus:ring-4 focus:ring-[#ee2b6c]/10 focus:border-[#ee2b6c] transition-all" 
                    value={manualAmount} 
                    onChange={(e) => setManualAmount(e.target.value)} 
                    autoFocus 
                  />
                  {isOverpaying && !isOverpayingTotal && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-xs">info</span>
                      O excedente abaterá automaticamente a próxima parcela.
                    </p>
                  )}
                  {isOverpayingTotal && (
                    <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Este valor quita TODAS as parcelas e sobra crédito.
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <button 
                    disabled={isProcessing || !manualAmount || parseFloat(manualAmount) <= 0}
                    onClick={() => handlePay(selectedInstallment.id, parseFloat(manualAmount), true)} 
                    className="w-full h-14 bg-[#ee2b6c] hover:bg-[#d41b55] text-white font-black rounded-2xl shadow-xl shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'PROCESSANDO...' : 'CONFIRMAR RECEBIMENTO'}
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={() => setSelectedInstallment(null)} 
                    className="w-full h-10 text-gray-400 text-xs font-black uppercase hover:text-gray-600 transition-colors"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#ee2b6c]/20" 
              placeholder="Buscar por cliente ou WhatsApp..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Tabela de Parcelas */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente & Débito Total</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Vencimento</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor da Parcela</th>
                  <th className="px-6 py-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                   Array.from({length: 4}).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="p-8"><div className="skeleton h-12 w-full rounded-2xl"></div></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-gray-400 italic text-sm">Nenhuma parcela encontrada.</td>
                  </tr>
                ) : filtered.map(inst => {
                  const customer = customers.find(c => c.id === inst.customer_id);
                  const totalDebt = customerDebts[inst.customer_id] || 0;
                  const isOverdue = new Date(inst.due_date) < new Date() && inst.status !== 'paid';

                  return (
                    <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-extrabold text-gray-900 leading-tight mb-0.5">{customer?.name}</p>
                          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter">
                            Total Devedor: <span className="bg-purple-50 px-1.5 py-0.5 rounded">{formatCurrency(totalDebt)}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
                            {new Date(inst.due_date).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] font-black text-gray-300 uppercase">Parcela {inst.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-sm font-black text-[#4a1d96]">{formatCurrency(inst.value)}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {tab === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openManualModal(inst)} 
                              className="text-[#4a1d96] hover:bg-purple-50 border border-purple-100 text-[10px] font-black px-4 py-2 rounded-xl transition-all"
                            >
                              ABATER
                            </button>
                            <button 
                              onClick={() => handlePay(inst.id, inst.value)} 
                              className={`text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 ${isOverdue ? 'bg-red-500 hover:bg-red-600' : 'bg-[#ee2b6c] hover:bg-[#d41b55]'}`}
                            >
                              PAGAR TUDO
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            PAGO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo no Rodapé */}
        <div className="bg-[#4a1d35] p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-pink-300">account_balance_wallet</span>
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Soma das Parcelas Filtradas</p>
              <h3 className="text-3xl font-black">{formatCurrency(filtered.reduce((acc, i) => acc + i.value, 0))}</h3>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4">
              <p className="text-[9px] opacity-40 uppercase font-black">Contagem</p>
              <p className="text-xl font-black">{filtered.length}</p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="text-center px-4">
              <p className="text-[9px] text-pink-300 uppercase font-black">Vencidas</p>
              <p className="text-xl font-black text-pink-400">
                {filtered.filter(i => new Date(i.due_date) < new Date()).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credit;
