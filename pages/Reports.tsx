
import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../services/supabaseMock';
import { Sale, Expense, Installment, PaymentMethod } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [s, e, i] = await Promise.all([db.getSales(), db.getExpenses(), db.getInstallments()]);
        setSales(s);
        setExpenses(e);
        setInstallments(i);
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const monthlyReport = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const getMonthRevenue = (month: number, year: number) => {
      const direct = sales
        .filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === month && d.getFullYear() === year && s.payment_method !== PaymentMethod.INSTALLMENT;
        })
        .reduce((acc, s) => acc + s.total_value, 0);

      const installmentPaid = installments.reduce((acc, i) => {
        if (i.status === 'paid') {
          const d = i.paid_at ? new Date(i.paid_at) : new Date(i.due_date);
          if (d.getMonth() === month && d.getFullYear() === year) {
            const sale = sales.find(s => s.id === i.sale_id);
            if (sale) {
              return acc + (sale.total_value / (sale.installments_count || 1));
            }
          }
        }
        return acc;
      }, 0);

      return direct + installmentPaid;
    };

    const getMonthExpenses = (month: number, year: number) => {
      return expenses
        .filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((acc, e) => acc + e.value, 0);
    };

    const thisMonthRevenue = getMonthRevenue(currentMonth, currentYear);
    const lastMonthRevenue = getMonthRevenue(lastMonth, lastMonthYear);
    const thisMonthExpenses = getMonthExpenses(currentMonth, currentYear);
    const lastMonthExpenses = getMonthExpenses(lastMonth, lastMonthYear);

    const stats = {
      thisMonth: {
        revenue: thisMonthRevenue,
        expenses: thisMonthExpenses,
        profit: thisMonthRevenue - thisMonthExpenses
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        expenses: lastMonthExpenses,
        profit: lastMonthRevenue - lastMonthExpenses
      }
    };

    const calcGrowth = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };

    return {
      ...stats,
      growth: {
        revenue: calcGrowth(stats.thisMonth.revenue, stats.lastMonth.revenue),
        expenses: calcGrowth(stats.thisMonth.expenses, stats.lastMonth.expenses),
        profit: calcGrowth(stats.thisMonth.profit, stats.lastMonth.profit)
      }
    };
  }, [sales, expenses, installments]);

  const chartData = [
    { name: 'Mês Anterior', Faturamento: monthlyReport.lastMonth.revenue, Despesas: monthlyReport.lastMonth.expenses },
    { name: 'Mês Atual', Faturamento: monthlyReport.thisMonth.revenue, Despesas: monthlyReport.thisMonth.expenses }
  ];

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8f6f6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ee2b6c]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#4a1d35] tracking-tight">Histórico & Relatórios</h1>
          <p className="text-sm text-gray-500">Fluxo de Caixa Baseado em Recebimentos Reais.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComparisonCard
            title="Entrada Real (Cash Flow)"
            value={formatCurrency(monthlyReport.thisMonth.revenue)}
            lastValue={formatCurrency(monthlyReport.lastMonth.revenue)}
            growth={monthlyReport.growth.revenue}
            color="text-emerald-600"
          />
          <ComparisonCard
            title="Despesas Pagas"
            value={formatCurrency(monthlyReport.thisMonth.expenses)}
            lastValue={formatCurrency(monthlyReport.lastMonth.expenses)}
            growth={monthlyReport.growth.expenses}
            reverse
            color="text-red-500"
          />
          <ComparisonCard
            title="Lucro Real"
            value={formatCurrency(monthlyReport.thisMonth.profit)}
            lastValue={formatCurrency(monthlyReport.lastMonth.profit)}
            growth={monthlyReport.growth.profit}
            color="text-[#4a1d96]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Comparativo Mensal (Receita Líquida)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#fcfbfc' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Faturamento" fill="#ee2b6c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#4a1d96" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6">Métricas de Rentabilidade</h3>
            <div className="space-y-6">
              <HealthItem label="Margem Líquida" value={`${((monthlyReport.thisMonth.profit / (monthlyReport.thisMonth.revenue || 1)) * 100).toFixed(1)}%`} description="Quanto sobra de cada real que entra no caixa." />
              <HealthItem label="Cobertura de Custos" value={`${((monthlyReport.thisMonth.revenue / (monthlyReport.thisMonth.expenses || 1))).toFixed(1)}x`} description="Vezes que a receita cobre as despesas fixas." />
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                <p className="text-sm font-bold text-[#ee2b6c] mb-1 italic">Dica Bico Fino:</p>
                <p className="text-xs text-[#89616f]">
                  Os dados acima mostram o dinheiro que já caiu na conta. Lembre-se que você ainda tem
                  <strong> {formatCurrency(installments.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.value, 0))}</strong> a receber em parcelas futuras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonCard = ({ title, value, lastValue, growth, reverse, color }: any) => {
  const isPositive = growth > 0;
  const isGood = reverse ? !isPositive : isPositive;
  const trendColor = isGood ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group overflow-hidden">
      <div className="z-10 relative">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Mês anterior: <span className="font-bold">{lastValue}</span></p>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5">
        <span className="material-symbols-outlined text-8xl">{isPositive ? 'trending_up' : 'trending_down'}</span>
      </div>
    </div>
  );
};

const HealthItem = ({ label, value, description }: any) => (
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm font-bold text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 max-w-[200px]">{description}</p>
    </div>
    <span className="text-lg font-black text-[#4a1d96]">{value}</span>
  </div>
);

export default Reports;
