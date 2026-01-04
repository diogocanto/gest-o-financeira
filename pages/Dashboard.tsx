
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../services/supabaseMock';
import { Link } from 'react-router-dom';
import { Sale, Expense, Installment, Product, PaymentMethod } from '../types';

const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, e, i, p] = await Promise.all([
        db.getSales(),
        db.getExpenses(),
        db.getInstallments(),
        db.getProducts()
      ]);
      setSales(s);
      setExpenses(e);
      setInstallments(i);
      setProducts(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isCurrentMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    // 1. Faturamento de Vendas Diretas (Pix, Dinheiro, Cartão) do mês atual
    const immediateIncome = sales
      .filter(s => s.payment_method !== PaymentMethod.INSTALLMENT && isCurrentMonth(s.date))
      .reduce((acc, s) => acc + s.total_value, 0);

    // 2. Faturamento de Parcelas de Crediário PAGAS (Usando due_date como fallback já que paid_at inexiste)
    const installmentIncome = installments
      .filter(i => i.status === 'paid' && isCurrentMonth(i.due_date))
      .reduce((acc, i) => acc + i.value, 0);

    const monthlyIncome = immediateIncome + installmentIncome;

    const monthlyExpenses = expenses
      .filter(e => isCurrentMonth(e.date))
      .reduce((acc, e) => acc + e.value, 0);
    
    const pendingCredit = installments.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.value, 0);
    const totalStockValue = products.reduce((acc, p) => acc + (p.sale_price * p.stock), 0);

    return { 
      monthlyBalance: monthlyIncome - monthlyExpenses,
      monthlyIncome,
      pendingCredit,
      totalStockValue
    };
  }, [sales, expenses, installments, products]);

  const formatValue = (val: number) => {
    if (!showValues) return 'R$ ••••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#4a1d35]">Visão Geral</h2>
            <p className="text-sm text-gray-500">Controle de Fluxo de Caixa Real</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowValues(!showValues)}
              className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-[#ee2b6c] transition-colors shadow-sm"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              <span className="material-symbols-outlined">{showValues ? 'visibility' : 'visibility_off'}</span>
            </button>
            <Link to="/vendas" className="bg-[#ee2b6c] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg">Nova Venda</Link>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard loading={loading} title="Faturamento Real (Mês)" value={formatValue(stats.monthlyIncome)} trend="Receita" type="up" subtitle="Entradas à vista + parcelas pagas" />
          <StatCard loading={loading} title="Patrimônio Estoque" value={formatValue(stats.totalStockValue)} trend="Ativo" type="balance" subtitle="Valor total em estoque" />
          <StatCard loading={loading} title="Saldo Líquido" value={formatValue(stats.monthlyBalance)} trend="Lucro" type="balance" subtitle="Receita real menos despesas" />
          <div className="bg-gradient-to-br from-[#ee2b6c] to-[#4a1d96] p-6 rounded-2xl shadow-lg text-white">
            <p className="text-white/90 text-sm font-medium">Crediário em Aberto</p>
            {loading ? <div className="h-10 w-32 skeleton bg-white/20 rounded mt-2"></div> : <h3 className="text-3xl font-bold mt-1">{formatValue(stats.pendingCredit)}</h3>}
            <Link to="/crediario" className="inline-block mt-4 text-xs font-bold bg-white text-[#ee2b6c] px-3 py-1.5 rounded-lg">Gerenciar Cobranças</Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold mb-6">Gráfico de Faturamento Diário</h3>
          {loading ? <div className="h-full w-full skeleton rounded"></div> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.slice(0, 15).reverse().map(s => ({ name: new Date(s.date).toLocaleDateString(), valor: s.total_value }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="valor" stroke="#ee2b6c" fill="#ee2b6c" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, type, subtitle, loading }: any) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:border-[#ee2b6c]/30 transition-all">
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
      {loading ? <div className="h-10 w-3/4 skeleton rounded mt-2"></div> : (
        <>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-50 text-[#ee2b6c]`}>{trend}</span>
            <span className="text-gray-400 text-[10px]">{subtitle}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
