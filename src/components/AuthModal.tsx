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
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleToggleMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setSubmitted(false);
    setError('');
    // Reset inputs when switching modes
    setUsername('');
    setPassword('');
    setFullName('');
    setPhone('');
  };

  // Validation helpers for warning classes
  const isUsernameEmpty = submitted && !username.trim();
  const isPasswordEmpty = submitted && !password.trim();
  const isFullNameEmpty = submitted && !isLogin && !fullName.trim();
  const isPhoneEmpty = submitted && !isLogin && !phone.trim();
  const isPhoneInvalidFormat = submitted && !isLogin && phone.trim().length > 0 && !/^\d{10}$/.test(phone.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(true);

    // Front-end validation
    if (isLogin) {
      if (!username.trim() || !password.trim()) {
        setError('Vui lòng điền đầy đủ thông tin tài khoản và mật khẩu!');
        return;
      }
    } else {
      if (!username.trim() || !password.trim() || !fullName.trim() || !phone.trim()) {
        setError('Vui lòng điền đầy đủ các thông tin bắt buộc còn trống!');
        return;
      }
      if (!/^\d{10}$/.test(phone.trim())) {
        setError('Số điện thoại không hợp lệ! Số điện thoại phải gồm đúng 10 chữ số.');
        return;
      }
    }

    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { username: username.trim(), password }
      : { username: username.trim(), password, fullName: fullName.trim(), phone: phone.trim(), role };

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
            <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-semibold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                <span>Tên đăng nhập <span className="text-rose-500">*</span></span>
                {isUsernameEmpty && (
                  <span className="text-rose-500 text-[10px] font-medium animate-pulse">Không được để trống</span>
                )}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${isUsernameEmpty ? 'text-rose-400' : 'text-slate-400'}`}>
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full bg-white border rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-xs ${
                    isUsernameEmpty 
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' 
                      : 'border-slate-200 focus:border-[#10B981]'
                  }`}
                  placeholder="Nhập username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                <span>Mật khẩu <span className="text-rose-500">*</span></span>
                {isPasswordEmpty && (
                  <span className="text-rose-500 text-[10px] font-medium animate-pulse">Không được để trống</span>
                )}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${isPasswordEmpty ? 'text-rose-400' : 'text-slate-400'}`}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-white border rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-xs ${
                    isPasswordEmpty 
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' 
                      : 'border-slate-200 focus:border-[#10B981]'
                  }`}
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                    <span>Họ và tên <span className="text-rose-500">*</span></span>
                    {isFullNameEmpty && (
                      <span className="text-rose-500 text-[10px] font-medium animate-pulse">Không được để trống</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full bg-white border rounded-xl py-2 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-xs ${
                      isFullNameEmpty 
                        ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' 
                        : 'border-slate-200 focus:border-[#10B981]'
                    }`}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                    <span>Số điện thoại <span className="text-rose-500">*</span></span>
                    {isPhoneEmpty && (
                      <span className="text-rose-500 text-[10px] font-medium animate-pulse">Không được để trống</span>
                    )}
                    {isPhoneInvalidFormat && (
                      <span className="text-rose-500 text-[10px] font-medium animate-pulse">Phải gồm đúng 10 chữ số</span>
                    )}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${isPhoneEmpty || isPhoneInvalidFormat ? 'text-rose-400' : 'text-slate-400'}`}>
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full bg-white border rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-xs ${
                        isPhoneEmpty || isPhoneInvalidFormat
                          ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' 
                          : 'border-slate-200 focus:border-[#10B981]'
                      }`}
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
                  onClick={() => handleToggleMode(false)}
                  className="text-[#10B981] hover:underline font-bold"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => handleToggleMode(true)}
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
