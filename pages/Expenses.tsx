
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/supabaseMock.ts';
import { EXPENSE_CATEGORIES } from '../constants.tsx';
import { Expense } from '../types';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    description: '', 
    value: 0, 
    category: EXPENSE_CATEGORIES[0], 
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Pix' 
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await db.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setFormData({
      description: exp.description,
      value: exp.value,
      category: exp.category,
      date: exp.date.split('T')[0],
      payment_method: exp.payment_method
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      description: '', 
      value: 0, 
      category: EXPENSE_CATEGORIES[0], 
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Pix' 
    });
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.value <= 0) return alert('Descrição e Valor são obrigatórios');
    
    try {
      if (editingId) {
        await db.updateExpense(editingId, formData);
        alert('Despesa atualizada!');
      } else {
        await db.addExpense(formData);
        alert('Despesa registrada!');
      }
      await loadExpenses();
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('Erro ao processar.');
    }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full flex flex-col gap-6">
          <header className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#4a1d35]">Despesas</h1>
            {editingId && (
              <button onClick={handleCancelEdit} className="text-xs font-bold text-[#ee2b6c] border border-[#ee2b6c] px-3 py-1.5 rounded-lg">Cancelar Edição</button>
            )}
          </header>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Descrição</span>
                <input className="h-11 rounded-xl border-gray-200 focus:ring-[#ee2b6c]" placeholder="Ex: Aluguel" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase">Valor (R$)</span>
                <input type="number" step="0.01" className="h-11 rounded-xl border-gray-200" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase">Data</span>
                <input type="date" className="h-11 rounded-xl border-gray-200" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </label>
              <button type="submit" className="md:col-span-2 h-12 bg-[#ee2b6c] text-white font-bold rounded-xl shadow-lg mt-2">
                {editingId ? 'Salvar Alterações' : 'Registrar Despesa'}
              </button>
            </form>
          </div>
        </div>

        <div className="w-full lg:w-[350px] bg-white rounded-2xl p-6 border border-gray-200 shadow-sm max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Recentes</h3>
          <div className="space-y-4">
            {expenses.map(exp => (
              <div key={exp.id} className="flex justify-between items-center pb-3 border-b last:border-0 group">
                <div>
                  <p className="text-sm font-bold text-gray-800">{exp.description}</p>
                  <p className="text-[10px] text-gray-500">{new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">-{formatCurrency(exp.value)}</p>
                  <button onClick={() => handleEdit(exp)} className="text-[10px] text-[#ee2b6c] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
