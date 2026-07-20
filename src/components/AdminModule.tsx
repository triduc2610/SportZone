import React, { useState, useEffect, useMemo } from 'react';
import { User, CourtCluster, Booking, BookingStatus, ClusterStatus } from '../types';
import { 
  Users, Building, DollarSign, Calendar, Check, X, ShieldAlert, 
  MapPin, AlertCircle, BarChart2, Briefcase, Activity, Flame, Sparkles, Target,
  ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';

interface AdminModuleProps {
  user: User;
  activeTab: 'approvals' | 'users' | 'market';
  setActiveTab: (tab: 'approvals' | 'users' | 'market') => void;
}

export default function AdminModule({ user, activeTab, setActiveTab }: AdminModuleProps) {
  
  // Data sets
  const [pendingClusters, setPendingClusters] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // User deletion & feedback states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeleteUser = async (userIdToDelete: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Xóa người dùng thành công khỏi hệ thống!');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchAdminStats();
      } else {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi xóa người dùng.');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage('Không thể kết nối với máy chủ.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Pagination states
  const [approvalsPage, setApprovalsPage] = useState(1);
  const APPROVALS_PER_PAGE = 5;

  const [usersPage, setUsersPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // Reset page when switching tabs
  useEffect(() => {
    setApprovalsPage(1);
    setUsersPage(1);
  }, [activeTab]);

  const totalApprovalsPages = useMemo(() => {
    return Math.ceil(pendingClusters.length / APPROVALS_PER_PAGE);
  }, [pendingClusters]);

  const paginatedPendingClusters = useMemo(() => {
    const startIndex = (approvalsPage - 1) * APPROVALS_PER_PAGE;
    return pendingClusters.slice(startIndex, startIndex + APPROVALS_PER_PAGE);
  }, [pendingClusters, approvalsPage]);

  const totalUsersPages = useMemo(() => {
    return adminStats && adminStats.users
      ? Math.ceil(adminStats.users.length / USERS_PER_PAGE)
      : 0;
  }, [adminStats]);

  const paginatedUsers = useMemo(() => {
    if (!adminStats || !adminStats.users) return [];
    const startIndex = (usersPage - 1) * USERS_PER_PAGE;
    return adminStats.users.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [adminStats, usersPage]);

  useEffect(() => {
    fetchPendingClusters();
    fetchAdminStats();
  }, [activeTab]);

  const fetchPendingClusters = () => {
    fetch('/api/admin/clusters')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only pending
          const pending = data.filter((c: any) => c.status === 'pending');
          setPendingClusters(pending);
        }
      })
      .catch(err => console.error("Error fetching pending clusters:", err));
  };

  const fetchAdminStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          setAdminStats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching admin stats:", err);
        setLoading(false);
      });
  };

  const handleUpdateClusterStatus = async (clusterId: string, status: ClusterStatus) => {
    try {
      const res = await fetch(`/api/admin/clusters/${clusterId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(status === 'approved' ? 'Đã phê duyệt cụm sân thành công!' : 'Đã từ chối cụm sân!');
        fetchPendingClusters();
        fetchAdminStats();
      }
    } catch {
      alert('Có lỗi xảy ra khi phê duyệt.');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getSportIcon = (sportName: string) => {
    if (sportName.includes('Bóng đá')) return <Flame className="text-rose-400" size={14} />;
    if (sportName.includes('Cầu lông')) return <Activity className="text-amber-400" size={14} />;
    if (sportName.includes('Pickleball')) return <Sparkles className="text-teal-400" size={14} />;
    return <Target className="text-indigo-400" size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-800 pb-px gap-6">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'approvals' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building size={16} />
          Phê duyệt cụm sân ({pendingClusters.length})
          {activeTab === 'approvals' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'users' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users size={16} />
          Quản trị tài khoản
          {activeTab === 'users' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('market')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'market' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 size={16} />
          Đánh giá thị trường Hà Nội
          {activeTab === 'market' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>
      </div>

      {/* Overview stats for Admin */}
      {adminStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Doanh thu toàn hệ thống</span>
            <span className="text-base font-bold text-emerald-400 block">{formatVND(adminStats.totalRevenue)}</span>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tổng số lượt đặt sân</span>
            <span className="text-base font-bold text-white block">{adminStats.totalBookings} giao dịch</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tổng số người dùng</span>
            <span className="text-base font-bold text-white block">{adminStats.usersCount} tài khoản</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tổng số cụm sân</span>
            <span className="text-base font-bold text-white block">{adminStats.clusterCount} địa điểm</span>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Hồ sơ Cụm sân chờ phê duyệt</h2>
            <p className="text-xs text-slate-400">Kiểm tra thông tin pháp lý, địa giới hành chính Hà Nội và tính minh bạch của chủ sân</p>
          </div>

          <div className="space-y-4">
            {pendingClusters.length > 0 ? (
              paginatedPendingClusters.map(c => (
                <div 
                  key={c.id}
                  className="p-5 bg-slate-950 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2 rounded-md font-semibold">
                        Chờ thẩm định
                      </span>
                      <span className="text-[10px] text-slate-500">Mã cụm: {c.id}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-emerald-400" />
                        {c.address} ({c.districtName})
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 bg-slate-900 p-3 rounded-lg border border-slate-850">
                      <strong>Mô tả cụm sân:</strong> {c.description}
                    </p>

                    <div className="text-[10px] text-slate-400">
                      Đăng ký bởi đối tác chủ sân: <strong className="text-white">{c.ownerName}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 self-stretch md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-900">
                    <button
                      onClick={() => handleUpdateClusterStatus(c.id, 'approved' as ClusterStatus)}
                      className="flex-1 md:flex-initial py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check size={14} />
                      Phê duyệt
                    </button>
                    <button
                      onClick={() => handleUpdateClusterStatus(c.id, 'rejected' as ClusterStatus)}
                      className="flex-1 md:flex-initial py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-400 font-medium rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X size={14} />
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-slate-950 border border-slate-850 rounded-xl">
                <p className="text-xs text-slate-500">Không có cụm sân nào đang chờ thẩm định duyệt!</p>
              </div>
            )}

            {/* Pagination controls for approvals */}
            {totalApprovalsPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setApprovalsPage(prev => Math.max(prev - 1, 1))}
                  disabled={approvalsPage === 1}
                  className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    approvalsPage === 1
                      ? 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-[#10B981] hover:border-[#10B981]/50'
                  }`}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Trang {approvalsPage} / {totalApprovalsPages}
                </span>
                <button
                  type="button"
                  onClick={() => setApprovalsPage(prev => Math.min(prev + 1, totalApprovalsPages))}
                  disabled={approvalsPage === totalApprovalsPages}
                  className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    approvalsPage === totalApprovalsPages
                      ? 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-[#10B981] hover:border-[#10B981]/50'
                  }`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && adminStats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Quản trị Thành viên & Đối tác</h2>
              <p className="text-xs text-slate-400">Xem và phân cấp quyền quản lý người dùng hệ thống SportZone</p>
            </div>
          </div>

          {/* Alert banners */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
              <Check size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-850">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400">
                  <th className="p-4 font-semibold">Tên thành viên</th>
                  <th className="p-4 font-semibold">Tên đăng nhập</th>
                  <th className="p-4 font-semibold">Số điện thoại</th>
                  <th className="p-4 font-semibold">Vai trò phân cấp</th>
                  <th className="p-4 font-semibold">Ngày đăng ký</th>
                  <th className="p-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {paginatedUsers?.map((u: any) => {
                  let roleColor = '';
                  let roleLabel = '';
                  if (u.role === 'admin') {
                    roleColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    roleLabel = 'Hệ thống Admin';
                  } else if (u.role === 'owner') {
                    roleColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    roleLabel = 'Đối tác Chủ sân';
                  } else {
                    roleColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    roleLabel = 'Người chơi';
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/20 text-slate-300">
                      <td className="p-4 font-medium text-white">{u.fullName}</td>
                      <td className="p-4 font-mono text-slate-400">{u.username}</td>
                      <td className="p-4 text-slate-400">{u.phone}</td>
                      <td className="p-4">
                        <span className={`py-0.5 px-2 rounded border text-[10px] font-semibold ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="p-4 text-right">
                        {u.id === user.id ? (
                          <span className="text-[10px] text-slate-500 font-semibold italic">
                            Đang đăng nhập
                          </span>
                        ) : confirmDeleteId === u.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                            <span className="text-[10px] text-rose-400 font-semibold">Xóa?</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteUser(u.id);
                                setConfirmDeleteId(null);
                              }}
                              className="py-0.5 px-2 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              Có
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="py-0.5 px-2 bg-slate-800 text-slate-300 rounded text-[10px] font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              Không
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(u.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Xóa người dùng"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls for users */}
          {totalUsersPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-1">
              <button
                type="button"
                onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                disabled={usersPage === 1}
                className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  usersPage === 1
                    ? 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-[#10B981] hover:border-[#10B981]/50'
                }`}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] text-slate-400 font-semibold">
                Trang {usersPage} / {totalUsersPages}
              </span>
              <button
                type="button"
                onClick={() => setUsersPage(prev => Math.min(prev + 1, totalUsersPages))}
                disabled={usersPage === totalUsersPages}
                className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  usersPage === totalUsersPages
                    ? 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-[#10B981] hover:border-[#10B981]/50'
                }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'market' && adminStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Market Demand Assessment: Bookings / Revenue by district */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Mật độ Đặt sân theo Quận huyện (Đánh giá thị trường)</h3>
              <p className="text-[10px] text-slate-400">Xem phân bố lượt đặt sân tại các quận Hà Nội để hỗ trợ chủ sân khai thác hợp lý</p>
            </div>

            <div className="space-y-4 bg-slate-950 p-5 border border-slate-850 rounded-xl">
              {adminStats.districtStats?.map((dist: any) => {
                const totalBookings = adminStats.totalBookings || 1;
                const percent = Math.round((dist.bookingCount / totalBookings) * 100);
                
                return (
                  <div key={dist.districtName} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-semibold text-white flex items-center gap-1">
                        <MapPin size={12} className="text-slate-500" />
                        {dist.districtName} 
                      </span>
                      <span className="font-bold text-emerald-400">
                        {dist.bookingCount} lượt ({percent}%) - <span className="text-[10px] font-normal text-slate-500">{formatVND(dist.revenue)}</span>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sport category market size */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Độ hấp dẫn của các bộ môn thể thao</h3>
              <p className="text-[10px] text-slate-400">Phân tích quy mô thị trường Hà Nội theo bộ môn (Bóng đá, Cầu lông, Pickleball, Tennis)</p>
            </div>

            <div className="space-y-4 bg-slate-950 p-5 border border-slate-850 rounded-xl">
              {adminStats.sportStats?.map((sport: any) => {
                const totalRevenue = adminStats.totalRevenue || 1;
                const percent = Math.round((sport.revenue / totalRevenue) * 100);

                return (
                  <div key={sport.sportName} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {getSportIcon(sport.sportName)}
                        {sport.sportName} 
                      </span>
                      <span className="font-bold text-emerald-400">
                        {formatVND(sport.revenue)} ({percent}%) - <span className="text-[10px] font-normal text-slate-500">{sport.bookingCount} lượt đặt</span>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
