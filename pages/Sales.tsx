
import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/supabaseMock';
import { Product, PaymentMethod, Customer } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [installments, setInstallments] = useState(1);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c] = await Promise.all([db.getProducts(), db.getCustomers()]);
        setProducts(p);
        setCustomers(c);
      } catch (err) {
        console.error('Error loading sales data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = useMemo(() => 
    products.filter(p => (p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.model.toLowerCase().includes(searchProduct.toLowerCase())) && p.stock > 0),
  [products, searchProduct]);

  const filteredCustomers = useMemo(() => 
    customers.filter(c => c.name.toLowerCase().includes(searchCustomer.toLowerCase())),
  [customers, searchCustomer]);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.sale_price * item.quantity), 0);
  const total = subtotal;

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev;
        return prev.map(item => item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    setSearchProduct('');
  };

  const updateQuantity = (productId: string, diff: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + diff);
        if (newQty > item.product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const handleFinishSale = async () => {
    if (cart.length === 0) return alert('Carrinho vazio');
    if (paymentMethod === PaymentMethod.INSTALLMENT && !selectedCustomer) {
      return alert('Selecione um cliente para vendas em crediário');
    }

    try {
      await db.createSale(
        { 
          customer_id: selectedCustomer?.id, 
          total_value: total, 
          payment_method: paymentMethod, 
          installments_count: paymentMethod === PaymentMethod.INSTALLMENT ? installments : undefined 
        },
        cart.map(i => ({ productId: i.product.id, quantity: i.quantity, price: i.product.sale_price }))
      );

      alert('Venda finalizada com sucesso!');
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod(PaymentMethod.CARD);
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar venda');
    }
  };

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8f6f6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ee2b6c]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Main Content Area - Scrollable on desktop, part of main flow on mobile */}
      <div className="flex flex-col flex-1 lg:overflow-y-auto px-4 py-6 lg:px-10 bg-[#f8f6f6]">
        <div className="max-w-[1000px] w-full mx-auto flex flex-col gap-6">
          <header className="mb-2">
            <h1 className="text-[#4a1d96] tracking-tight text-2xl lg:text-[32px] font-bold text-center lg:text-left">Registro de Venda</h1>
            <p className="text-[#89616f] text-xs lg:text-sm text-center lg:text-left font-medium opacity-70">Nova Venda #{Math.floor(Math.random() * 100000)} • {new Date().toLocaleDateString('pt-BR')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <p className="text-[#4a1d96] text-xs font-black uppercase tracking-widest pb-2">Cliente</p>
              <div className="relative group">
                <input 
                  className="w-full rounded-2xl border-gray-200 h-14 pl-12 pr-4 focus:ring-4 focus:ring-[#ee2b6c]/10 focus:border-[#ee2b6c] transition-all bg-white shadow-sm" 
                  placeholder="Buscar cliente..." 
                  value={selectedCustomer ? selectedCustomer.name : searchCustomer}
                  onChange={e => {
                    setSearchCustomer(e.target.value);
                    if (selectedCustomer) setSelectedCustomer(null);
                  }}
                />
                <span className="material-symbols-outlined absolute left-4 top-4 text-[#ee2b6c]">person_search</span>
                {selectedCustomer && (
                  <button onClick={() => setSelectedCustomer(null)} className="absolute right-4 top-4 text-[#ee2b6c]">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
                {!selectedCustomer && searchCustomer && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-2xl mt-2 z-30 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => { setSelectedCustomer(c); setSearchCustomer(''); }}
                        className="w-full text-left px-5 py-4 hover:bg-pink-50 text-sm flex justify-between items-center border-b border-gray-50 last:border-0"
                      >
                        <div className="flex flex-col">
                           <span className="font-bold text-[#4a1d35]">{c.name}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{c.phone}</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <p className="text-[#4a1d96] text-xs font-black uppercase tracking-widest pb-2">Adicionar Produto</p>
              <div className="relative">
                <input 
                  className="w-full rounded-2xl border-gray-200 h-14 pl-12 pr-4 focus:ring-4 focus:ring-[#ee2b6c]/10 focus:border-[#ee2b6c] transition-all bg-white shadow-sm" 
                  placeholder="Nome, modelo ou código..." 
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-4 top-4 text-[#ee2b6c]">qr_code_scanner</span>
                {searchProduct && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-2xl mt-2 z-30 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => addToCart(p)}
                        className="w-full text-left px-5 py-4 hover:bg-pink-50 text-sm flex justify-between items-center border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="font-bold text-[#4a1d35]">{p.name} <span className="text-[10px] text-gray-400 font-normal">({p.size})</span></p>
                          <p className="text-[10px] font-bold text-[#89616f] uppercase tracking-tighter">{p.model} • Est: {p.stock}</p>
                        </div>
                        <span className="font-black text-[#ee2b6c]">{formatCurrency(p.sale_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col mb-8 lg:mb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-5 text-[#4a1d96] text-[10px] font-black uppercase tracking-widest w-[40%]">Produto</th>
                    <th className="px-6 py-5 text-[#4a1d96] text-[10px] font-black uppercase tracking-widest text-center">Qtd.</th>
                    <th className="px-6 py-5 text-[#4a1d96] text-[10px] font-black uppercase tracking-widest text-right">Subtotal</th>
                    <th className="px-6 py-5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <tr key={item.product.id} className="hover:bg-pink-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#181113] text-sm">{item.product.name} ({item.product.size})</span>
                          <span className="text-[#89616f] text-[9px] uppercase font-black tracking-wider mt-0.5">Unit: {formatCurrency(item.product.sale_price)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center rounded-xl border-2 border-gray-100 h-9 overflow-hidden bg-white">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-full hover:bg-gray-50 flex items-center justify-center text-[#4a1d96]"><span className="material-symbols-outlined text-sm">remove</span></button>
                          <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-full hover:bg-gray-50 flex items-center justify-center text-[#4a1d96]"><span className="material-symbols-outlined text-sm">add</span></button>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-[#4a1d96] text-sm">{formatCurrency(item.product.sale_price * item.quantity)}</td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => updateQuantity(item.product.id, -item.quantity)} className="text-gray-300 hover:text-[#ee2b6c] transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-gray-400 text-sm font-medium italic">O carrinho está vazio. Comece adicionando produtos acima.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {cart.length > 0 && (
              <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-4 flex justify-end gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>{cart.length} Modelos</span>
                <span className="text-gray-200">|</span>
                <span className="text-[#ee2b6c]">{cart.reduce((a, b) => a + b.quantity, 0)} Peças no Total</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Sidebar - Mobile: Natural flow at bottom | Desktop: Fixed right side */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col lg:h-full shadow-2xl z-10 shrink-0">
        <div className="p-6 lg:p-8 flex-1 flex flex-col gap-8 lg:overflow-y-auto">
          <h3 className="text-[#4a1d96] text-xl font-black flex items-center gap-3">
            <div className="size-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ee2b6c]">payments</span>
            </div>
            Resumo Financeiro
          </h3>
          
          <div className="flex flex-col gap-4 p-6 bg-[#f8f6f6] rounded-3xl border border-gray-100 shadow-inner">
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span>Subtotal</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
              <span>Desconto</span>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-100">
                <span className="text-[10px]">R$</span>
                <input className="w-16 text-right border-none p-0 text-sm font-black text-[#ee2b6c] focus:ring-0" defaultValue="0,00" />
              </div>
            </div>
            <div className="h-px bg-gray-200/50 my-2"></div>
            <div className="flex justify-between items-end text-[#4a1d96]">
              <span className="font-black text-lg tracking-tight uppercase">Total</span>
              <span className="font-black text-4xl tracking-tighter">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Forma de Pagamento</h4>
            <div className="grid grid-cols-2 gap-3">
              {[PaymentMethod.PIX, PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.INSTALLMENT].map(m => {
                const isSelected = paymentMethod === m;
                let icon = 'payments';
                if (m === PaymentMethod.PIX) icon = 'photos';
                if (m === PaymentMethod.CARD) icon = 'credit_card';
                if (m === PaymentMethod.INSTALLMENT) icon = 'receipt_long';
                
                return (
                  <button 
                    key={m} 
                    onClick={() => setPaymentMethod(m)}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                      isSelected 
                        ? 'border-[#ee2b6c] bg-pink-50 shadow-lg shadow-pink-100' 
                        : 'border-gray-50 bg-white hover:border-pink-100 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-[#ee2b6c]' : 'text-[#4a1d96]'} transition-colors`}>{icon}</span>
                    <span className={`text-xs font-black uppercase tracking-tighter ${isSelected ? 'text-[#ee2b6c]' : 'text-gray-500'}`}>{m}</span>
                    {isSelected && <div className="absolute top-2 right-2 size-2 bg-[#ee2b6c] rounded-full"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === PaymentMethod.INSTALLMENT && (
            <div className="p-5 bg-purple-50 rounded-3xl border border-purple-100 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-black text-[#4a1d96] uppercase mb-3 tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_repeat</span> Condição de Parcelamento
              </p>
              <div className="flex flex-col gap-2">
                <select 
                  className="rounded-xl border-gray-100 w-full text-xs font-bold h-11 focus:ring-[#4a1d96]/20 bg-white" 
                  value={installments} 
                  onChange={e => setInstallments(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}x de {formatCurrency(total / n)}</option>)}
                </select>
                <p className="text-[9px] text-purple-400 font-bold italic mt-1">* Parcelas mensais no carnê Bico Fino.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8 border-t border-gray-100 bg-white lg:sticky bottom-0">
          <button 
            onClick={handleFinishSale}
            className="flex w-full cursor-pointer items-center justify-center rounded-2xl h-16 bg-[#ee2b6c] hover:bg-[#d91e5b] text-white text-lg font-black shadow-2xl shadow-pink-200 transition-all active:scale-[0.98] gap-3"
          >
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <span>FINALIZAR VENDA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
