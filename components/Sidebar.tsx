
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Added React import to satisfy TypeScript namespace requirements
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/vendas', label: 'Vendas', icon: 'shopping_bag' },
    { path: '/crediario', label: 'Crediário', icon: 'credit_card' },
    { path: '/despesas', label: 'Despesas', icon: 'receipt_long' },
    { separator: 'Gestão' },
    { path: '/clientes', label: 'Clientes', icon: 'group' },
    { path: '/estoque', label: 'Estoque', icon: 'inventory_2' },
    { path: '/usuarios', label: 'Usuários', icon: 'person_check' },
    { path: '/relatorios', label: 'Relatórios', icon: 'bar_chart' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#4a1d35] text-white flex-shrink-0 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#ee2b6c]/20 p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[#ee2b6c] text-3xl">checkroom</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">Bico Fino</h1>
              <span className="text-xs text-white/60 font-medium mt-1">Roupas & Acessórios</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Principal</p>
          {links.map((link, index) => {
            if ('separator' in link) {
              return (
                <p key={index} className="px-4 text-xs font-bold text-white/40 uppercase tracking-wider mb-2 mt-6">
                  {link.separator}
                </p>
              );
            }
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path!}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#ee2b6c] text-white shadow-lg shadow-[#ee2b6c]/30' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-xl transition-colors text-left">
            <div className="size-10 rounded-full border-2 border-[#ee2b6c] bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ee2b6c] text-2xl">person</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Melina Quevedo</p>
              <p className="text-xs text-white/60 truncate">Gerente</p>
            </div>
            <span className="material-symbols-outlined text-white/40">settings</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
