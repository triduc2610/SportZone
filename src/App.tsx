import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import AuthModal from './components/AuthModal';
import CustomerModule from './components/CustomerModule';
import OwnerModule from './components/OwnerModule';
import AdminModule from './components/AdminModule';
import DocumentationModule from './components/DocumentationModule';
import { 
  Flame, ShieldAlert, LogIn, LogOut, Sparkles, 
  MapPin, Activity, HelpCircle, User as UserIcon, Settings, Calendar
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [activePortal, setActivePortal] = useState<string>('customer_search');
  const [adminPendingCount, setAdminPendingCount] = useState<number>(0);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        // Set correct portal based on role on load
        if (parsed.role === UserRole.OWNER) {
          setActivePortal('owner_clusters');
        } else if (parsed.role === UserRole.ADMIN) {
          setActivePortal('admin_users');
        } else {
          setActivePortal('customer_search');
        }
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
        localStorage.removeItem('user');
      }
    } else {
      setActivePortal('customer_search');
    }
  }, []);

  // Fetch pending count for admin badge
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      fetch('/api/admin/clusters')
        .then(res => res.json())
        .then(data => {
          const pending = data.filter((c: any) => c.status === 'pending');
          setAdminPendingCount(pending.length);
        })
        .catch(() => {});
    }
  }, [currentUser, activePortal]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (user.role === UserRole.OWNER) {
      setActivePortal('owner_clusters');
    } else if (user.role === UserRole.ADMIN) {
      setActivePortal('admin_users');
    } else {
      setActivePortal('customer_search');
    }
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    setActivePortal('customer_search');
    setIsLogoutConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#1A1C1E] font-sans selection:bg-[#10B981] selection:text-white flex flex-col">
      
      {/* Primary Application Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            SZ
          </div>
          <div>
            <h1 className="text-base font-display font-extrabold text-[#064E3B] tracking-tight flex items-center gap-1.5">
              SportZone Hà Nội
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wide font-sans">Đặt sân trực tuyến thời gian thực tại Thủ đô</p>
          </div>
        </div>

        {/* Global User status block */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            {currentUser ? (
              <>
                <span className="text-xs font-bold text-slate-800">{currentUser.fullName}</span>
                <span className="text-[10px] text-[#10B981] font-semibold">
                  {currentUser.role === UserRole.ADMIN && 'Quản trị viên'}
                  {currentUser.role === UserRole.OWNER && 'Đối tác Chủ sân'}
                  {currentUser.role === UserRole.CUSTOMER && 'Thành viên Người chơi'}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-500">Xem chế độ khách</span>
            )}
          </div>

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
              title="Đăng xuất"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-2 px-4 bg-[#10B981] hover:bg-[#064E3B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <LogIn size={14} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </header>

      {/* Active portal selector bar */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex gap-2 overflow-x-auto">
        {!currentUser && (
          <>
            <button
              onClick={() => setActivePortal('customer_search')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'customer_search'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚽ Trang chủ & Tìm kiếm sân
            </button>
          </>
        )}

        {currentUser?.role === UserRole.CUSTOMER && (
          <>
            <button
              onClick={() => setActivePortal('customer_search')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'customer_search'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚽ Trang chủ & Tìm kiếm sân
            </button>
            <button
              onClick={() => setActivePortal('customer_history')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'customer_history'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🕒 Lịch sử đặt sân
            </button>
            <button
              onClick={() => setActivePortal('customer_ai')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activePortal === 'customer_ai'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤖 Trợ lý AI SportZone
            </button>
            <button
              onClick={() => setActivePortal('customer_profile')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'customer_profile'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👤 Thông tin cá nhân
            </button>
          </>
        )}

        {currentUser?.role === UserRole.OWNER && (
          <>
            <button
              onClick={() => setActivePortal('owner_clusters')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'owner_clusters'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏢 Cấu hình cụm sân
            </button>
            <button
              onClick={() => setActivePortal('owner_bookings')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'owner_bookings'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📝 Duyệt lịch đặt
            </button>
            <button
              onClick={() => setActivePortal('owner_stats')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'owner_stats'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 Thống kê doanh thu cụm sân
            </button>
          </>
        )}

        {currentUser?.role === UserRole.ADMIN && (
          <>
            <button
              onClick={() => setActivePortal('owner_clusters')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'owner_clusters'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏢 Quản lý & Sửa Sân
            </button>
            <button
              onClick={() => setActivePortal('admin_users')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'admin_users'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👥 Quản lý tài khoản chủ sân
            </button>
            <button
              onClick={() => setActivePortal('admin_approvals')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'admin_approvals'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏢 Duyệt cụm sân {adminPendingCount > 0 && `(${adminPendingCount})`}
            </button>
            <button
              onClick={() => setActivePortal('admin_market')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePortal === 'admin_market'
                  ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 Báo cáo doanh thu toàn hệ thống
            </button>
          </>
        )}

        <button
          onClick={() => setActivePortal('project_docs')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activePortal === 'project_docs'
              ? 'bg-[#10B981]/10 text-[#064E3B] border border-[#10B981]/20 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📚 Tài liệu & Biểu đồ UML
        </button>

      </nav>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activePortal.startsWith('customer') && (
          <CustomerModule 
            user={currentUser} 
            onOpenAuth={() => setIsAuthModalOpen(true)} 
            activeTab={
              activePortal === 'customer_search' ? 'search' :
              activePortal === 'customer_history' ? 'history' :
              activePortal === 'customer_ai' ? 'ai' :
              activePortal === 'customer_profile' ? 'profile' : 'search'
            }
            setActiveTab={(tab) => {
              if (tab === 'search') setActivePortal('customer_search');
              if (tab === 'history') setActivePortal('customer_history');
              if (tab === 'ai') setActivePortal('customer_ai');
              if (tab === 'profile') setActivePortal('customer_profile');
            }}
          />
        )}
        
        {activePortal.startsWith('owner') && (currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN) && (
          <OwnerModule 
            user={currentUser} 
            activeTab={
              activePortal === 'owner_clusters' ? 'clusters' :
              activePortal === 'owner_bookings' ? 'bookings' :
              activePortal === 'owner_stats' ? 'stats' : 'clusters'
            }
            setActiveTab={(tab) => {
              if (tab === 'clusters') setActivePortal('owner_clusters');
              if (tab === 'bookings') setActivePortal('owner_bookings');
              if (tab === 'stats') setActivePortal('owner_stats');
            }}
          />
        )}

        {activePortal.startsWith('admin') && currentUser?.role === UserRole.ADMIN && (
          <AdminModule 
            user={currentUser} 
            activeTab={
              activePortal === 'admin_approvals' ? 'approvals' :
              activePortal === 'admin_users' ? 'users' :
              activePortal === 'admin_market' ? 'market' : 'approvals'
            }
            setActiveTab={(tab) => {
              if (tab === 'approvals') setActivePortal('admin_approvals');
              if (tab === 'users') setActivePortal('admin_users');
              if (tab === 'market') setActivePortal('admin_market');
            }}
          />
        )}

        {activePortal === 'project_docs' && (
          <DocumentationModule />
        )}

      </main>

      {/* Beautiful humble page footer */}
      <footer className="border-t border-[#E2E8F0] bg-white px-6 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <p>© 2026 SportZone</p>
        </div>
      </footer>

      {/* Auth Modal overlay */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div id="logout-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLogoutConfirmOpen(false)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 transform transition-all flex flex-col items-center text-center">
            {/* Warning Icon Container */}
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <LogOut size={24} className="ml-1" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">Đăng xuất tài khoản</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống **SportZone Hà Nội** không? Các phiên làm việc hiện tại của bạn sẽ kết thúc.
            </p>

            {/* Actions Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors text-xs font-bold cursor-pointer shadow-xs"
              >
                Xác nhận thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
