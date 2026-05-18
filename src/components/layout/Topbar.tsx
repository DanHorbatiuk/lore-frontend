import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

export function Topbar() {
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="h-14 bg-white border-b border-slate-100 shadow-sm flex items-center justify-between px-4 flex-shrink-0">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <Menu size={18} />
      </button>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{user?.username}</span>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Вийти"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
