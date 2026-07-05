import React, { useState, useEffect } from 'react';
import { User, CourtCluster, Court, PricingRule, Booking, BookingStatus, ClusterStatus } from '../types';
import { 
  Building, Plus, Calendar, Clock, DollarSign, Activity, Sparkles, 
  Target, Flame, Check, X, TrendingUp, Users, MapPin, BarChart2 
} from 'lucide-react';

interface OwnerModuleProps {
  user: User;
  activeTab: 'clusters' | 'bookings' | 'stats';
  setActiveTab: (tab: 'clusters' | 'bookings' | 'stats') => void;
}

export default function OwnerModule({ user, activeTab, setActiveTab }: OwnerModuleProps) {
  
  // Data lists
  const [districts, setDistricts] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [myClusters, setMyClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [incomingBookings, setIncomingBookings] = useState<any[]>([]);
  
  // New Cluster form states
  const [clusterName, setClusterName] = useState('');
  const [clusterDistrictId, setClusterDistrictId] = useState('');
  const [clusterAddress, setClusterAddress] = useState('');
  const [clusterDesc, setClusterDesc] = useState('');
  const [clusterImage, setClusterImage] = useState('');
  const [showClusterForm, setShowClusterForm] = useState(false);
  
  // New Court form states
  const [courtName, setCourtName] = useState('');
  const [courtSportId, setCourtSportId] = useState('');
  const [courtBasePrice, setCourtBasePrice] = useState('');
  const [showCourtForm, setShowCourtForm] = useState(false);

  // New Pricing Rule form states
  const [ruleStart, setRuleStart] = useState('17');
  const [ruleEnd, setRuleEnd] = useState('21');
  const [ruleMultiplier, setRuleMultiplier] = useState('1.3');
  const [rulePrice, setRulePrice] = useState('390000');
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Owner analytics state
  const [stats, setStats] = useState<any | null>(null);

  // Edit Cluster states
  const [isEditingCluster, setIsEditingCluster] = useState(false);
  const [editClusterName, setEditClusterName] = useState('');
  const [editClusterDistrictId, setEditClusterDistrictId] = useState('');
  const [editClusterAddress, setEditClusterAddress] = useState('');
  const [editClusterDesc, setEditClusterDesc] = useState('');
  const [editClusterImage, setEditClusterImage] = useState('');

  // Edit Court states
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editCourtName, setEditCourtName] = useState('');
  const [editCourtSportId, setEditCourtSportId] = useState('');
  const [editCourtBasePrice, setEditCourtBasePrice] = useState('');

  useEffect(() => {
    fetch('/api/districts')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setDistricts(data);
      })
      .catch(err => console.error("Error fetching districts:", err));

    fetch('/api/sports')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setSports(data);
      })
      .catch(err => console.error("Error fetching sports:", err));

    fetchMyClusters();
    fetchIncomingBookings();
    fetchStats();
  }, [user]);

  const fetchMyClusters = () => {
    // We can fetch approved & pending clusters by filtering inside our client
    // By matching ownerId
    fetch('/api/admin/clusters')
      .then(res => res.ok ? res.json() : [])
      .then(allClusters => {
        if (Array.isArray(allClusters)) {
          const mine = user.role === 'admin' ? allClusters : allClusters.filter((c: any) => c.ownerId === user.id);
          setMyClusters(mine);
          if (mine.length > 0 && !selectedCluster) {
            handleSelectCluster(mine[0].id);
          }
        }
      })
      .catch(err => console.error("Error fetching clusters:", err));
  };

  const handleSelectCluster = (clusterId: string) => {
    fetch(`/api/clusters/${clusterId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          setSelectedCluster(data);
        }
      })
      .catch(err => console.error("Error fetching cluster details:", err));
  };

  const fetchIncomingBookings = () => {
    fetch(`/api/bookings/owner/${user.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setIncomingBookings(data);
      })
      .catch(err => console.error("Error fetching bookings:", err));
  };

  const fetchStats = () => {
    fetch(`/api/owner/stats/${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) setStats(data);
      })
      .catch(err => console.error("Error fetching stats:", err));
  };

  const handleCreateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clusterName || !clusterDistrictId || !clusterAddress || !clusterDesc) {
      alert('Vui lòng nhập đầy đủ các trường thông tin!');
      return;
    }

    try {
      const res = await fetch('/api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          name: clusterName,
          districtId: clusterDistrictId,
          address: clusterAddress,
          description: clusterDesc,
          imageUrl: clusterImage || undefined
        })
      });

      if (res.ok) {
        alert('Gửi cụm sân thành công! Vui lòng chờ quản trị viên hệ thống phê duyệt hồ sơ.');
        setClusterName('');
        setClusterAddress('');
        setClusterDesc('');
        setClusterImage('');
        setShowClusterForm(false);
        fetchMyClusters();
      }
    } catch {
      alert('Có lỗi xảy ra khi tạo cụm sân.');
    }
  };

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCluster || !courtName || !courtSportId || !courtBasePrice) {
      alert('Vui lòng điền đủ thông tin sân con!');
      return;
    }

    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: selectedCluster.id,
          name: courtName,
          sportId: courtSportId,
          basePrice: Number(courtBasePrice)
        })
      });

      if (res.ok) {
        alert('Thêm sân con thành công!');
        setCourtName('');
        setCourtBasePrice('');
        setShowCourtForm(false);
        handleSelectCluster(selectedCluster.id);
        fetchStats();
      }
    } catch {
      alert('Có lỗi xảy ra khi thêm sân con.');
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ cụm sân thể thao này?\nHành động này sẽ xóa vĩnh viễn tất cả sân con, giờ vàng, lượt đặt sân và không thể khôi phục!")) {
      return;
    }

    try {
      const res = await fetch(`/api/clusters/${clusterId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Xóa cụm sân thành công!");
        setSelectedCluster(null);
        fetchMyClusters();
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi xóa cụm sân.");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi xóa cụm sân.");
    }
  };

  const handleUpdateCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCluster) return;

    if (!editClusterName || !editClusterDistrictId || !editClusterAddress || !editClusterDesc) {
      alert("Vui lòng nhập đầy đủ thông tin cụm sân!");
      return;
    }

    try {
      const res = await fetch(`/api/clusters/${selectedCluster.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editClusterName,
          districtId: editClusterDistrictId,
          address: editClusterAddress,
          description: editClusterDesc,
          imageUrl: editClusterImage
        })
      });

      if (res.ok) {
        alert("Cập nhật cụm sân thành công!");
        setIsEditingCluster(false);
        handleSelectCluster(selectedCluster.id);
        fetchMyClusters();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi cập nhật cụm sân.");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi cập nhật cụm sân.");
    }
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sân con này không?\nHành động này sẽ hủy tất cả các lịch đặt hiện tại của sân con này!")) {
      return;
    }

    try {
      const res = await fetch(`/api/courts/${courtId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Xóa sân con thành công!");
        if (selectedCluster) {
          handleSelectCluster(selectedCluster.id);
        }
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi xóa sân con.");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi xóa sân con.");
    }
  };

  const handleUpdateCourt = async (courtId: string) => {
    if (!editCourtName || !editCourtSportId || !editCourtBasePrice) {
      alert("Vui lòng nhập đầy đủ thông tin sân con!");
      return;
    }

    try {
      const res = await fetch(`/api/courts/${courtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCourtName,
          sportId: editCourtSportId,
          basePrice: Number(editCourtBasePrice)
        })
      });

      if (res.ok) {
        alert("Cập nhật sân con thành công!");
        setEditingCourtId(null);
        if (selectedCluster) {
          handleSelectCluster(selectedCluster.id);
        }
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Có lỗi xảy ra khi cập nhật sân con.");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi cập nhật sân con.");
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCluster) return;

    const firstCourt = selectedCluster.courts?.[0];
    if (!firstCourt) {
      alert('Vui lòng thêm ít nhất một sân con trước khi cấu hình giờ vàng!');
      return;
    }

    try {
      const computedMultiplier = Number(rulePrice) / firstCourt.basePrice;
      const res = await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: selectedCluster.id,
          startHour: Number(ruleStart),
          endHour: Number(ruleEnd),
          priceMultiplier: Number(computedMultiplier.toFixed(2))
        })
      });

      if (res.ok) {
        alert('Cấu hình khung giờ tăng giá thành công!');
        setShowRuleForm(false);
        handleSelectCluster(selectedCluster.id);
      }
    } catch {
      alert('Có lỗi xảy ra khi cấu hình giờ vàng.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, byOwner: true }),
      });
      if (res.ok) {
        alert('Cập nhật trạng thái lịch thành công!');
        fetchIncomingBookings();
        fetchStats();
      }
    } catch {
      alert('Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getSportIcon = (sportId: string) => {
    switch (sportId) {
      case 's-1': return <Flame className="text-rose-400" size={16} />;
      case 's-2': return <Activity className="text-amber-400" size={16} />;
      case 's-3': return <Sparkles className="text-teal-400" size={16} />;
      default: return <Target className="text-indigo-400" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-header */}
      <div className="flex border-b border-slate-800 pb-px gap-6">
        <button
          onClick={() => setActiveTab('clusters')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'clusters' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building size={16} />
          Quản lý cụm sân của tôi
          {activeTab === 'clusters' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'bookings' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar size={16} />
          Xác nhận Đặt sân ({incomingBookings.filter(b => b.status === 'pending_payment' || b.status === 'paid').length})
          {activeTab === 'bookings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-xs font-semibold relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'stats' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 size={16} />
          Báo cáo doanh thu
          {activeTab === 'stats' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
        </button>
      </div>

      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Cluster List & Register Form */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-bold text-white">Danh sách cụm sân</span>
              <button
                onClick={() => setShowClusterForm(!showClusterForm)}
                className="py-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-[10px] cursor-pointer flex items-center gap-1"
              >
                <Plus size={12} />
                Đăng ký cụm mới
              </button>
            </div>

            {showClusterForm && (
              <form onSubmit={handleCreateCluster} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Khai báo cụm sân thể thao Hà Nội</h3>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tên cụm sân</label>
                  <input
                    type="text"
                    required
                    value={clusterName}
                    onChange={(e) => setClusterName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    placeholder="Ví dụ: Sân bóng Đại học Y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Quận/Huyện Hà Nội</label>
                  <select
                    required
                    value={clusterDistrictId}
                    onChange={(e) => setClusterDistrictId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Chọn quận huyện...</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    required
                    value={clusterAddress}
                    onChange={(e) => setClusterAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    placeholder="Số 1 Tôn Thất Tùng..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Ảnh đại diện (URL)</label>
                  <input
                    type="url"
                    value={clusterImage}
                    onChange={(e) => setClusterImage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    placeholder="Để trống nếu muốn lấy ảnh ngẫu nhiên"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Mô tả giới thiệu dịch vụ</label>
                  <textarea
                    required
                    rows={3}
                    value={clusterDesc}
                    onChange={(e) => setClusterDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder="Khán đài rộng, đèn chiếu sáng ban đêm..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-2 rounded-lg text-xs cursor-pointer"
                  >
                    Gửi yêu cầu duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClusterForm(false)}
                    className="px-3 bg-slate-950 hover:bg-slate-850 border border-slate-805 text-slate-400 rounded-lg text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {myClusters.map(c => {
                const isSelected = selectedCluster?.id === c.id;
                let badgeColor = '';
                let statusText = '';
                if (c.status === 'approved') {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  statusText = 'Đang hoạt động';
                } else if (c.status === 'pending') {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  statusText = 'Chờ duyệt';
                } else {
                  badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  statusText = 'Từ chối';
                }

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCluster(c.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected 
                        ? 'bg-emerald-500/5 border-emerald-500' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-bold text-white leading-tight">{c.name}</h4>
                      <span className={`text-[9px] font-semibold py-0.5 px-2 rounded border shrink-0 ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {c.districtName} - {c.address}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2 & 3: Detailed Courts inside Selected Cluster */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCluster ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedCluster.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-400" />
                      {selectedCluster.address} ({selectedCluster.districtName})
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setIsEditingCluster(true);
                        setEditClusterName(selectedCluster.name);
                        setEditClusterDistrictId(selectedCluster.districtId);
                        setEditClusterAddress(selectedCluster.address);
                        setEditClusterDesc(selectedCluster.description || '');
                        setEditClusterImage(selectedCluster.imageUrl || '');
                      }}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      Sửa cụm
                    </button>
                    <button
                      onClick={() => handleDeleteCluster(selectedCluster.id)}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 border border-rose-950/40 text-rose-400 hover:bg-rose-950/20 font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      Xóa cụm
                    </button>
                    <button
                      onClick={() => setShowCourtForm(!showCourtForm)}
                      className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Thêm sân con
                    </button>
                    <button
                      onClick={() => setShowRuleForm(!showRuleForm)}
                      className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Clock size={14} />
                      Cài giờ vàng
                    </button>
                  </div>
                </div>

                {isEditingCluster ? (
                  <form onSubmit={handleUpdateCluster} className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-850 animate-fade-in">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Building size={14} className="text-emerald-400" />
                      Chỉnh sửa thông tin Cụm sân
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Tên cụm sân</label>
                        <input
                          type="text"
                          required
                          value={editClusterName}
                          onChange={(e) => setEditClusterName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Quận/Huyện Hà Nội</label>
                        <select
                          required
                          value={editClusterDistrictId}
                          onChange={(e) => setEditClusterDistrictId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Chọn quận huyện...</option>
                          {districts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">Địa chỉ chi tiết</label>
                        <input
                          type="text"
                          required
                          value={editClusterAddress}
                          onChange={(e) => setEditClusterAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">Ảnh đại diện (URL)</label>
                        <input
                          type="url"
                          value={editClusterImage}
                          onChange={(e) => setEditClusterImage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-1">Mô tả giới thiệu dịch vụ</label>
                        <textarea
                          required
                          rows={3}
                          value={editClusterDesc}
                          onChange={(e) => setEditClusterDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => setIsEditingCluster(false)}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Cập nhật cụm sân
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Adding a new Court (Sân con) Form */}
                    {showCourtForm && (
                      <form onSubmit={handleCreateCourt} className="p-4 bg-slate-950 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tên sân con</label>
                      <input
                        type="text"
                        required
                        value={courtName}
                        onChange={(e) => setCourtName(e.target.value)}
                        placeholder="Ví dụ: Sân cỏ nhân tạo số 3"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Bộ môn thi đấu</label>
                      <select
                        required
                        value={courtSportId}
                        onChange={(e) => setCourtSportId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Chọn bộ môn...</option>
                        {sports.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Giá cơ bản / giờ (VND)</label>
                      <input
                        type="number"
                        required
                        value={courtBasePrice}
                        onChange={(e) => setCourtBasePrice(e.target.value)}
                        placeholder="Ví dụ: 300000"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-900">
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                      >
                        Lưu sân con
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCourtForm(false)}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 py-1.5 px-3 rounded-lg text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}

                {/* Adding a new Pricing Rule Form */}
                {showRuleForm && (
                  <form onSubmit={handleCreateRule} className="p-4 bg-slate-950 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-fade-in">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Giờ bắt đầu tăng giá</label>
                      <select
                        value={ruleStart}
                        onChange={(e) => setRuleStart(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none"
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Giờ kết thúc tăng giá</label>
                      <select
                        value={ruleEnd}
                        onChange={(e) => setRuleEnd(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none"
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Giá giờ vàng trực tiếp (VND/giờ)
                        {selectedCluster.courts?.[0] && ` (gốc: ${formatVND(selectedCluster.courts[0].basePrice)})`}
                      </label>
                      <input
                        type="number"
                        required
                        value={rulePrice}
                        onChange={(e) => setRulePrice(e.target.value)}
                        placeholder="Ví dụ: 390000"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-900">
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs cursor-pointer"
                      >
                        Cài đặt giá trực tiếp
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRuleForm(false)}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 py-1.5 px-3 rounded-lg text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Courts and active pricing rules */}
                <div className="space-y-4">
                  <div className="border-t border-slate-850 pt-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sân con đang quản lý</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCluster.courts && selectedCluster.courts.length > 0 ? (
                        selectedCluster.courts.map((court: any) => {
                          const isEditing = editingCourtId === court.id;
                          return (
                            <div key={court.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-3">
                              {isEditing ? (
                                <div className="space-y-3 w-full">
                                  <div>
                                    <label className="block text-[9px] text-slate-400 mb-0.5">Tên sân con</label>
                                    <input
                                      type="text"
                                      value={editCourtName}
                                      onChange={(e) => setEditCourtName(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-xs text-white"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[9px] text-slate-400 mb-0.5">Bộ môn</label>
                                      <select
                                        value={editCourtSportId}
                                        onChange={(e) => setEditCourtSportId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-xs text-slate-300"
                                      >
                                        {sports.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[9px] text-slate-400 mb-0.5">Giá gốc/giờ</label>
                                      <input
                                        type="number"
                                        value={editCourtBasePrice}
                                        onChange={(e) => setEditCourtBasePrice(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded py-1 px-2 text-xs text-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-900">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCourtId(null)}
                                      className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded text-[10px] cursor-pointer"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCourt(court.id)}
                                      className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      Lưu
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                                      {getSportIcon(court.sportId)}
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-white leading-tight">{court.name}</h4>
                                      <span className="text-[10px] text-slate-500 font-sans block mt-0.5">{court.sportName}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <div className="text-right">
                                      <span className="text-[9px] text-slate-500 block">Đơn giá cơ bản</span>
                                      <span className="text-xs font-semibold text-emerald-400">{formatVND(court.basePrice)}/h</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCourtId(court.id);
                                          setEditCourtName(court.name);
                                          setEditCourtSportId(court.sportId);
                                          setEditCourtBasePrice(court.basePrice.toString());
                                        }}
                                        className="text-[9px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 px-2 py-0.5 rounded cursor-pointer hover:text-emerald-400 transition-colors"
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCourt(court.id)}
                                        className="text-[9px] bg-slate-900 hover:bg-rose-950 hover:text-rose-400 border border-slate-800 text-slate-500 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-8 text-center text-xs text-slate-600">
                          Chưa khai báo sân con nào. Vui lòng bấm "Thêm sân con" phía trên!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active pricing rules */}
                  <div className="border-t border-slate-850 pt-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Cấu hình khung giờ vàng</h3>
                    {selectedCluster.pricingRules && selectedCluster.pricingRules.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedCluster.pricingRules.map((rule: any) => {
                          const basePrice = selectedCluster.courts?.[0]?.basePrice || 300000;
                          const peakPrice = Math.round(basePrice * rule.priceMultiplier);
                          return (
                            <div key={rule.id} className="py-2.5 px-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium flex flex-col gap-1">
                              <div className="flex items-center gap-2 font-bold">
                                <Sparkles size={12} />
                                <span>Giờ vàng: {rule.startHour}:00 - {rule.endHour}:00</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans">
                                Đơn giá trực tiếp: <strong className="text-amber-300">{formatVND(peakPrice)}/h</strong> (Hệ số x{rule.priceMultiplier})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500">Chưa thiết lập giờ vàng. Đơn giá sẽ áp dụng đồng nhất 24/24.</p>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-500">Vui lòng đăng ký cụm sân đầu tiên để bắt đầu quản lý!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incoming Booking Confirmation Dashboard */}
      {activeTab === 'bookings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Lịch đặt chờ đón người chơi check-in</h2>
            <p className="text-xs text-slate-400">Xác nhận lịch đặt trực tuyến của người chơi Hà Nội và cập nhật trạng thái chơi thực tế</p>
          </div>

          <div className="space-y-4">
            {incomingBookings.length > 0 ? (
              incomingBookings.map(b => {
                let statusBadge = '';
                let statusLabel = '';
                if (b.status === 'pending_payment') {
                  statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  statusLabel = 'Chờ chuyển khoản';
                } else if (b.status === 'paid') {
                  statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  statusLabel = 'Đã thanh toán';
                } else if (b.status === 'checked_in') {
                  statusBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  statusLabel = 'Đã nhận sân';
                } else {
                  statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  statusLabel = 'Đã hủy';
                }

                return (
                  <div key={b.id} className="p-5 bg-slate-950 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-semibold py-0.5 px-2 rounded-full border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {b.id}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{b.clusterName} - {b.courtName}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Khách hàng: <strong>{b.customerName}</strong> ({b.customerPhone})</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-emerald-400" />
                          <span>Ngày chơi: <strong>{b.bookingDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-emerald-400" />
                          <span>Giờ thi đấu: <strong>{b.startHour}:00 - {b.endHour}:00</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-emerald-400" />
                          <span>Tiền cọc: <strong className="text-emerald-400">{formatVND(b.totalPrice)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 self-stretch md:self-auto border-t md:border-t-0 border-slate-900 pt-3 md:pt-0">
                      {b.status === 'pending_payment' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'paid' as BookingStatus)}
                          className="flex-1 md:flex-initial py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={14} />
                          Nhận đủ tiền
                        </button>
                      )}
                      {b.status === 'paid' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'checked_in' as BookingStatus)}
                          className="flex-1 md:flex-initial py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={14} />
                          Xác nhận Check-in
                        </button>
                      )}
                      {(b.status === 'pending_payment' || b.status === 'paid') && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'cancelled' as BookingStatus)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-400 rounded-lg text-xs cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-slate-950 border border-slate-850 rounded-xl">
                <p className="text-xs text-slate-500">Chưa ghi nhận lịch đặt trực tuyến nào cho cụm sân của bạn!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Statistics View (Fully custom SVG bar chart with no external dependencies) */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Key metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Doanh thu tổng cụm</span>
              <span className="text-base font-bold text-emerald-400 block">{formatVND(stats.totalRevenue)}</span>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Lượt đặt thành công</span>
              <span className="text-base font-bold text-white block">{stats.totalBookings} lượt</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Số sân con khai thác</span>
              <span className="text-base font-bold text-white block">{stats.courtCount} sân con</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Cụm sân đăng ký</span>
              <span className="text-base font-bold text-white block">{stats.clusterCount} địa điểm</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom SVG Daily Revenue bar chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Doanh thu gần đây (7 ngày)</h3>
                <p className="text-[10px] text-slate-400">Doanh thu thực tế của các sân đã check-in hoặc đặt cọc trước</p>
              </div>

              {/* Native responsive SVG layout for robust presentation charts */}
              <div className="w-full bg-slate-950 p-4 border border-slate-850 rounded-xl">
                <svg viewBox="0 0 400 200" className="w-full h-auto">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="70" x2="380" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" />

                  {/* Draw bars dynamically */}
                  {stats.dailyStats?.map((day: any, idx: number) => {
                    const maxRevenue = Math.max(...stats.dailyStats.map((d: any) => d.revenue)) || 100000;
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 120 : 0;
                    const barWidth = 24;
                    const x = 50 + idx * 46;
                    const y = 160 - height;

                    // Format date string for label (e.g. 02-07)
                    const label = day.date.slice(-5);

                    return (
                      <g key={day.date} className="group cursor-pointer">
                        {/* Interactive Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="4"
                          fill="url(#emeraldGradient)"
                          className="hover:opacity-85 transition-opacity"
                        />
                        {/* Hover values */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fill="#34d399"
                          fontSize="8"
                          fontWeight="bold"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {day.revenue > 0 ? `${Math.round(day.revenue / 1000)}k` : '0'}
                        </text>
                        {/* X-axis labels */}
                        <text
                          x={x + barWidth / 2}
                          y="176"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="8"
                          fontWeight="medium"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* SVG gradients definition */}
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Sport revenue progress breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Doanh thu theo bộ môn</h3>
                <p className="text-[10px] text-slate-400">Hiệu suất và sự thu hút người chơi tại cụm sân của bạn</p>
              </div>

              <div className="space-y-4 bg-slate-950 p-5 border border-slate-850 rounded-xl">
                {stats.sportsStats?.map((sport: any) => {
                  const percent = stats.totalRevenue > 0 ? Math.round((sport.revenue / stats.totalRevenue) * 100) : 0;
                  return (
                    <div key={sport.name} className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          {sport.name}
                          <span className="text-[10px] text-slate-500 font-normal">({sport.count} lượt)</span>
                        </span>
                        <span className="font-bold text-emerald-400">{formatVND(sport.revenue)} ({percent}%)</span>
                      </div>
                      
                      {/* CSS progress bar */}
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
