
import { createClient } from '@supabase/supabase-js';
import { Customer, Product, Sale, SaleItem, Installment, Expense, PaymentMethod, AppUser } from '../types';

const SUPABASE_URL = 'https://bgivkxewtxxnevygtjeq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NieKSnqcWQ7VECf4ICA-HA_Ty2KpFPw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  // Usuários do App
  getAppUsers: async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('*').order('name');
      if (error) {
        // Erro 42P01 no Postgres significa que a relação (tabela) não existe
        if (error.code === '42P01' || error.message?.includes('schema cache')) {
          const tableError = new Error("TABELA_AUSENTE");
          (tableError as any).details = error.message;
          throw tableError;
        }
        throw error;
      }
      return data as AppUser[];
    } catch (err: any) {
      if (err.message === "TABELA_AUSENTE") throw err;
      throw new Error(err.message || "Erro desconhecido ao carregar usuários.");
    }
  },
  addAppUser: async (name: string, email: string) => {
    // Validação de limite local antes da tentativa de inserção
    const { count, error: countError } = await supabase.from('app_users').select('*', { count: 'exact', head: true });
    
    if (countError) {
      if (countError.code === '42P01' || countError.message?.includes('schema cache')) {
        throw new Error("TABELA_AUSENTE");
      }
      throw countError;
    }

    if (count !== null && count >= 4) {
      throw new Error("Limite máximo de 4 usuários atingido.");
    }

    const { data, error } = await supabase.from('app_users').insert([{ name, email }]).select();
    if (error) {
      console.error('Erro Supabase ao inserir usuário:', error);
      throw error;
    }
    return data?.[0] as AppUser;
  },

  getCustomers: async () => {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return data as Customer[];
  },
  addCustomer: async (customer: Omit<Customer, 'id' | 'created_at' | 'total_bought' | 'total_paid'>) => {
    const { data, error } = await supabase.from('customers').insert([{
      ...customer,
      total_bought: 0,
      total_paid: 0
    }]).select();
    if (error) throw error;
    return data?.[0] as Customer;
  },
  deleteCustomer: async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },
  getProducts: async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return data as Product[];
  },
  addProduct: async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase.from('products').insert([product]).select();
    if (error) throw error;
    return data?.[0] as Product;
  },
  updateProduct: async (id: string, product: Partial<Product>) => {
    const { data, error } = await supabase.from('products').update(product).eq('id', id).select();
    if (error) throw error;
    return data?.[0] as Product;
  },
  deleteProduct: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
  getSales: async () => {
    const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as Sale[];
  },
  createSale: async (saleData: Omit<Sale, 'id' | 'date'>, items: { productId: string, quantity: number, price: number }[]) => {
    const { data: sale, error: saleError } = await supabase.from('sales').insert([saleData]).select().single();
    if (saleError) throw saleError;

    const saleItems = items.map(item => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;

    if (saleData.payment_method === PaymentMethod.INSTALLMENT && saleData.customer_id) {
      const count = saleData.installments_count || 1;
      const installmentValue = saleData.total_value / count;
      const installmentsList = Array.from({ length: count }).map((_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          sale_id: sale.id,
          customer_id: saleData.customer_id,
          number: i + 1,
          value: installmentValue,
          due_date: dueDate.toISOString(),
          status: 'pending'
        };
      });
      await supabase.from('installments').insert(installmentsList);
    }

    for (const item of items) {
      await supabase.rpc('decrement_product_stock', {
        p_id: item.productId,
        p_quantity: item.quantity
      });
    }

    if (saleData.customer_id) {
      await supabase.rpc('increment_customer_bought', {
        c_id: saleData.customer_id,
        c_amount: saleData.total_value
      });
    }

    return sale;
  },
  getExpenses: async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data as Expense[];
  },
  addExpense: async (expense: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase.from('expenses').insert([expense]).select();
    if (error) throw error;
    return data?.[0] as Expense;
  },
  updateExpense: async (id: string, expense: Partial<Expense>) => {
    const { data, error } = await supabase.from('expenses').update(expense).eq('id', id).select();
    if (error) throw error;
    return data?.[0] as Expense;
  },
  getInstallments: async () => {
    const { data, error } = await supabase.from('installments').select('*').order('due_date');
    if (error) throw error;
    return data as Installment[];
  },
  payInstallment: async (installmentId: string, amountPaid: number) => {
    try {
      const { data: triggerInst, error: getError } = await supabase.from('installments').select('*').eq('id', installmentId).single();
      if (getError) throw getError;

      const { data: allPending, error: allPendingError } = await supabase
        .from('installments')
        .select('*')
        .eq('customer_id', triggerInst.customer_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });
      
      if (allPendingError) throw allPendingError;

      let remainingBalance = amountPaid;
      let installmentsProcessed = 0;

      for (const inst of allPending) {
        if (remainingBalance <= 0) break;

        const currentInstValue = inst.value;
        const updates: any = {};

        if (remainingBalance >= currentInstValue - 0.009) {
          updates.status = 'paid';
          updates.value = 0;
          remainingBalance -= currentInstValue;
        } else {
          updates.value = Number((currentInstValue - remainingBalance).toFixed(2));
          remainingBalance = 0;
        }

        const { error: updateError } = await supabase.from('installments').update(updates).eq('id', inst.id);
        if (updateError) throw updateError;
        installmentsProcessed++;
      }

      const { error: rpcError } = await supabase.rpc('increment_customer_paid', {
        c_id: triggerInst.customer_id,
        c_amount: amountPaid
      });
      
      if (rpcError) throw rpcError;
      
      return { 
        success: true, 
        installmentsProcessed, 
        remainingUserCredit: Number(remainingBalance.toFixed(2)) 
      };
    } catch (e) {
      console.error('Erro em payInstallment (Cascade):', e);
      throw e;
    }
  }
};
