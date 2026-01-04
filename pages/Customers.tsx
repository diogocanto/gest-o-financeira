
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/supabaseMock';
import { Customer } from '../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({ name: '', phone: '', birth_date: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [customers, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert('Campos obrigatórios: Nome e WhatsApp');
    
    try {
      await db.addCustomer(formData);
      await loadCustomers();
      setIsAdding(false);
      setFormData({ name: '', phone: '', birth_date: '' });
      alert('Cliente cadastrada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar cliente.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ Tem certeza que deseja remover a cliente "${name}"?\n\nIsso pode afetar o histórico de vendas vinculado.`)) {
      try {
        await db.deleteCustomer(id);
        await loadCustomers();
        alert('Cliente removida com sucesso!');
      } catch (err) {
        console.error(err);
        alert('Erro ao remover cliente. Verifique se ela possui vendas vinculadas.');
      }
    }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#4a1d35] tracking-tight">Clientes</h2>
            <p className="text-gray-500 text-xs md:text-sm">Controle de saldo e histórico de compras via Supabase.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#ee2b6c] hover:bg-[#d41b55] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined">person_add</span> Cadastrar Cliente
          </button>
        </header>

        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <form onSubmit={handleAdd} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#4a1d96] to-[#ee2b6c]"></div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-[#4a1d35] mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ee2b6c]">person_add</span> Nova Cliente
                </h3>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</span>
                    <input className="rounded-xl border-[#e6dbdf] focus:ring-[#ee2b6c]/20 h-11" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</span>
                    <input className="rounded-xl border-[#e6dbdf] focus:ring-[#ee2b6c]/20 h-11" placeholder="(00) 00000-0000" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data de Nascimento</span>
                    <input type="date" className="rounded-xl border-[#e6dbdf] focus:ring-[#ee2b6c]/20 h-11" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                  </label>
                </div>
                <div className="mt-8 flex gap-3">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-xl">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-[#ee2b6c] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#d41b55] transition-all">Salvar</button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-[#e6dbdf] shadow-sm">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-[#ee2b6c]/30" 
              placeholder="Pesquisar por nome ou telefone..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-[#e6dbdf] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-[#e6dbdf]">
                  <th className="px-6 py-4 text-xs font-bold text-[#4a1d35] uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#4a1d35] uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#4a1d35] uppercase tracking-wider">Histórico de Compras</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#4a1d35] uppercase tracking-wider text-right">Saldo Devedor</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dbdf]">
                {loading ? (
                   Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-8"><div className="h-6 w-full skeleton rounded"></div></td>
                    </tr>
                  ))
                ) : filtered.map(c => {
                  const debt = (Number(c.total_bought) || 0) - (Number(c.total_paid) || 0);
                  const hasDebt = debt > 0.01;
                  return (
                    <tr key={c.id} className="hover:bg-pink-50/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-purple-100 flex items-center justify-center text-[#4a1d35] font-bold text-sm">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none mb-1">{c.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Cliente desde {new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{c.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700">{formatCurrency(c.total_bought)} total</span>
                          <span className="text-[10px] text-green-600 font-bold uppercase">Pago: {formatCurrency(c.total_paid)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                          hasDebt 
                            ? 'bg-pink-100 text-[#ee2b6c] border border-pink-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {hasDebt ? formatCurrency(debt) : 'EM DIA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-400 hover:text-[#4a1d96] mx-2" title="Ver Detalhes"><span className="material-symbols-outlined text-xl">visibility</span></button>
                        <button className="text-gray-400 hover:text-[#ee2b6c] mx-2" title="Editar"><span className="material-symbols-outlined text-xl">edit</span></button>
                        <button 
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-gray-400 hover:text-red-500 mx-2" 
                          title="Remover Cliente"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm italic">Nenhuma cliente encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
