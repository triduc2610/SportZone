import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Lock, Phone, CreditCard, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { username, password }
      : { username, password, fullName, phone, role };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Lỗi máy chủ (Status: ${res.status}): ${text.slice(0, 120) || 'Không có phản hồi chi tiết.'}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra!');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-[#064E3B]">
                {isLogin ? 'Đăng nhập SportZone' : 'Đăng ký tài khoản'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Hệ thống đặt sân thể thao Hà Nội</p>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tên đăng nhập</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors shadow-xs"
                  placeholder="Nhập username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Mật khẩu</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors shadow-xs"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors shadow-xs"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors shadow-xs"
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Vai trò người dùng</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.CUSTOMER)}
                      className={`py-2 px-3 rounded-xl border text-sm font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                        role === UserRole.CUSTOMER
                          ? 'bg-[#10B981]/10 border-[#10B981] text-[#064E3B]'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span>Người chơi</span>
                      <span className="text-[10px] font-medium text-slate-400">Đặt lịch thể thao</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.OWNER)}
                      className={`py-2 px-3 rounded-xl border text-sm font-bold transition-colors flex flex-col items-center gap-1 cursor-pointer ${
                        role === UserRole.OWNER
                          ? 'bg-[#10B981]/10 border-[#10B981] text-[#064E3B]'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span>Chủ cụm sân</span>
                      <span className="text-[10px] font-medium text-slate-400">Quản lý & nhận sân</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#064E3B] text-white font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer mt-4 shadow-xs"
            >
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập ngay' : 'Đăng ký đối tác'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {isLogin ? (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-[#10B981] hover:underline font-bold"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-[#10B981] hover:underline font-bold"
                >
                  Đăng nhập tại đây
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
