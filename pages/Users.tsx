
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabaseMock';
import { AppUser } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  const MAX_USERS = 4;

  const SQL_SCRIPT = `-- Copie e cole este código no SQL Editor do seu Supabase:

CREATE TABLE public.app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Ativar Row Level Security (Segurança)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso simples para começar
CREATE POLICY "Permitir leitura geral" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Permitir inserção geral" ON public.app_users FOR INSERT WITH CHECK (true);`;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setTableMissing(false);
    try {
      const data = await db.getAppUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      if (err.message === "TABELA_AUSENTE") {
        setTableMissing(true);
      } else {
        alert("Erro inesperado: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email } = formData;
    if (!name.trim() || !email.trim()) return alert('Nome e Email são obrigatórios.');

    if (users.length >= MAX_USERS) {
      alert(`Limite máximo de ${MAX_USERS} usuários atingido.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addAppUser(name.trim(), email.trim());
      setFormData({ name: '', email: '' });
      alert('Usuário cadastrado com sucesso!');
      await loadUsers();
    } catch (err: any) {
      if (err.message === "TABELA_AUSENTE") {
        setTableMissing(true);
      } else {
        alert(`Falha no Cadastro: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    alert('Código SQL copiado! Cole no seu SQL Editor do Supabase.');
  };

  if (tableMissing) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6] flex items-center justify-center">
        <div className="max-w-[700px] w-full bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#4a1d35] p-6 text-white flex items-center gap-4">
            <div className="size-14 bg-[#ee2b6c] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-3xl">database</span>
            </div>
            <div>
              <h2 className="text-xl font-black">Configuração Necessária</h2>
              <p className="text-sm opacity-70">A tabela 'app_users' não foi encontrada no seu banco de dados.</p>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Para que o sistema de usuários funcione, você precisa criar a tabela no seu painel do <strong>Supabase</strong>. Siga os passos abaixo:
              </p>
              <ol className="text-xs font-bold text-gray-500 space-y-3 list-decimal pl-4">
                <li>Acesse o seu projeto no <a href="https://supabase.com/dashboard" target="_blank" className="text-[#ee2b6c] underline">Dashboard do Supabase</a>.</li>
                <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong>.</li>
                <li>Clique em <strong>New Query</strong>.</li>
                <li>Cole o código abaixo e clique em <strong>Run</strong>.</li>
              </ol>
            </div>

            <div className="relative group">
              <pre className="bg-gray-900 text-pink-300 p-5 rounded-2xl text-[10px] font-mono overflow-x-auto border-2 border-gray-800 leading-relaxed h-[200px]">
                {SQL_SCRIPT}
              </pre>
              <button 
                onClick={copySQL}
                className="absolute top-4 right-4 bg-[#ee2b6c] text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span> COPIAR SQL
              </button>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-3">
              <button 
                onClick={loadUsers}
                className="flex-1 h-12 bg-[#4a1d96] text-white font-black rounded-xl hover:bg-[#3a177a] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span> JÁ CRIEI, TENTAR NOVAMENTE
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const limitReached = users.length >= MAX_USERS;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f6f6]">
      <div className="max-w-[1000px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#4a1d35] tracking-tight">Equipe Bico Fino</h1>
            <p className="text-sm text-gray-500 font-medium">Gestão de acesso local limitada a {MAX_USERS} usuários.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-2 transition-colors ${limitReached ? 'bg-pink-50 border-pink-100' : 'bg-white border-gray-100'}`}>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status da Conta:</span>
            <span className={`text-sm font-black ${limitReached ? 'text-[#ee2b6c]' : 'text-emerald-600'}`}>
              {users.length} / {MAX_USERS} Ativos
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-[#4a1d35] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ee2b6c]">person_add</span>
                Novo Cadastro
              </h3>
              
              <form onSubmit={handleAddUser} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">
                    Nome Completo
                  </label>
                  <input 
                    type="text"
                    required
                    disabled={limitReached || isSubmitting}
                    className="w-full h-12 rounded-2xl border-gray-200 focus:ring-4 focus:ring-[#ee2b6c]/10 focus:border-[#ee2b6c] transition-all disabled:opacity-50"
                    placeholder="Ex: Melina Quevedo"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">
                    E-mail de Login
                  </label>
                  <input 
                    type="email"
                    required
                    disabled={limitReached || isSubmitting}
                    className="w-full h-12 rounded-2xl border-gray-200 focus:ring-4 focus:ring-[#ee2b6c]/10 focus:border-[#ee2b6c] transition-all disabled:opacity-50"
                    placeholder="email@bicofino.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                {limitReached ? (
                  <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex items-center gap-3 text-[#ee2b6c]">
                    <span className="material-symbols-outlined text-xl">warning</span>
                    <p className="text-[11px] font-black leading-tight">LIMITE ATINGIDO<br/><span className="font-medium opacity-70 italic">Remova um usuário para cadastrar outro.</span></p>
                  </div>
                ) : (
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#ee2b6c] hover:bg-[#d41b55] text-white font-black rounded-2xl shadow-xl shadow-pink-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        CADASTRAR EQUIPE
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Equipe Atual</h3>
                <span className="material-symbols-outlined text-gray-300">verified_user</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({length: 3}).map((_, i) => (
                    <div key={i} className="p-6 flex items-center gap-4">
                      <div className="size-12 rounded-full skeleton"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 skeleton rounded"></div>
                        <div className="h-3 w-1/4 skeleton rounded"></div>
                      </div>
                    </div>
                  ))
                ) : users.length === 0 ? (
                  <div className="p-20 text-center text-gray-400">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-10">shield_person</span>
                    <p className="text-sm font-bold italic">Nenhum usuário no sistema.</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                      <div className="size-12 rounded-2xl bg-[#4a1d96] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-100">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-gray-900 leading-tight">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Ativo</span>
                         <span className="text-[9px] text-gray-300 font-bold">Desde {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Users;
