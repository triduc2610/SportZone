import React, { useState, useEffect } from 'react';
import { User, CourtCluster, Court, PricingRule, Booking, BookingStatus } from '../types';
import { 
  Search, MapPin, Calendar, Clock, CreditCard, Flame, Activity, Sparkles, 
  Target, DollarSign, ChevronRight, MessageSquare, Send, CheckCircle, 
  AlertCircle, X, Info, Phone, ArrowLeft 
} from 'lucide-react';

interface CustomerModuleProps {
  user: User | null;
  onOpenAuth: () => void;
  activeTab: 'search' | 'history' | 'ai' | 'profile';
  setActiveTab: (tab: 'search' | 'history' | 'ai' | 'profile') => void;
}

export default function CustomerModule({ user, onOpenAuth, activeTab, setActiveTab }: CustomerModuleProps) {
  // States
  const [districts, setDistricts] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  
  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection States
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courtSlots, setCourtSlots] = useState<any[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
  
  // Checkout & Booking States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'vnpay' | 'transfer'>('momo');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  
  // Booking History State
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);

  // Gemini State
  const [aiInput, setAiInput] = useState('');
  const [aiChat, setAiChat] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Xin chào! Tôi là **Trợ lý ảo SportZone Hà Nội**. Bạn cần tôi tư vấn tìm cụm sân thể thao trống, sân bóng đá Đại học Y, hay các cụm sân pickleball mới nhất tại quận Cầu Giấy, Đống Đa?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetch('/api/districts').then(res => res.json()).then(setDistricts);
    fetch('/api/sports').then(res => res.json()).then(setSports);
    fetchClusters();
  }, [selectedDistrict, selectedSport]);

  useEffect(() => {
    if (user) {
      fetchBookingHistory();
    }
  }, [user, activeTab]);

  const fetchClusters = () => {
    let url = `/api/clusters?`;
    if (selectedDistrict) url += `districtId=${selectedDistrict}&`;
    if (selectedSport) url += `sportId=${selectedSport}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    
    fetch(url)
      .then(res => res.json())
      .then(setClusters);
  };

  const fetchBookingHistory = () => {
    if (!user) return;
    fetch(`/api/bookings/customer/${user.id}`)
      .then(res => res.json())
      .then(setBookingHistory);
  };

  // Fetch slots when court or date changes
  useEffect(() => {
    if (selectedCourt && bookingDate) {
      fetch(`/api/courts/${selectedCourt.id}/slots?date=${bookingDate}`)
        .then(res => res.json())
        .then(data => {
          setCourtSlots(data.slots || []);
          setSelectedHour(null);
          setEndHour(null);
        });
    }
  }, [selectedCourt, bookingDate]);

  const handleSelectCluster = (clusterId: string) => {
    fetch(`/api/clusters/${clusterId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedCluster(data);
        if (data.courts && data.courts.length > 0) {
          setSelectedCourt(data.courts[0]);
        } else {
          setSelectedCourt(null);
        }
      });
  };

  // Calculate current dynamic booking price
  const calculateBookingPrice = () => {
    if (!selectedCourt || selectedHour === null || endHour === null) return 0;
    let price = 0;
    const basePrice = selectedCourt.basePrice;
    const rules = selectedCluster?.pricingRules || [];

    for (let h = selectedHour; h < endHour; h++) {
      let slotPrice = basePrice;
      const rule = rules.find((r: any) => h >= r.startHour && h < r.endHour);
      if (rule) {
        slotPrice = Math.round(basePrice * rule.priceMultiplier);
      }
      price += slotPrice;
    }
    return price;
  };

  const handleBookingSubmit = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (selectedHour === null || endHour === null) return;

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          courtId: selectedCourt.id,
          bookingDate,
          startHour: selectedHour,
          endHour: endHour,
          paymentMethod
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi lưu lịch đặt sân!');
      }

      setBookingSuccess(data);
      // Refresh slots immediately
      if (selectedCourt && bookingDate) {
        fetch(`/api/courts/${selectedCourt.id}/slots?date=${bookingDate}`)
          .then(res => res.json())
          .then(d => setCourtSlots(d.slots || []));
      }
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch đặt sân này không?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        alert('Đã hủy lịch đặt sân thành công!');
        fetchBookingHistory();
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi hủy lịch.');
    }
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiChat(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setAiChat(prev => [...prev, { sender: 'ai', text: data.response }]);
      } else {
        setAiChat(prev => [...prev, { sender: 'ai', text: 'Rất tiếc, tôi đang bận xử lý dữ liệu sân bãi Hà Nội. Bạn có thể thử lại sau giây lát!' }]);
      }
    } catch {
      setAiChat(prev => [...prev, { sender: 'ai', text: 'Có lỗi xảy ra khi kết nối máy chủ AI.' }]);
    } finally {
      setAiLoading(false);
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
      {/* Top Banner Navigation */}
      <div className="flex bg-white border border-[#E2E8F0] rounded-2xl p-1.5 gap-1.5 max-w-md shadow-xs overflow-x-auto">
        <button
          onClick={() => { setActiveTab('search'); setSelectedCluster(null); }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
            activeTab === 'search'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Đặt sân thể thao
        </button>
        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              setActiveTab('history');
            }
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Lịch sử của tôi
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-teal-50 to-[#10B981] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={12} />
          Trợ lý AI
        </button>
        {user && (
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Thông tin cá nhân
          </button>
        )}
      </div>

      {activeTab === 'search' && !selectedCluster && (
        <div className="space-y-6">
          {/* Advanced Search Panel */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-display font-extrabold text-[#064E3B] flex items-center gap-2">
              <Search size={18} className="text-[#10B981]" />
              Tìm kiếm sân bóng, cầu lông, pickleball trống tại Hà Nội
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập tên cụm sân hoặc địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchClusters(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors"
                />
                <button 
                  onClick={fetchClusters}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#10B981]"
                >
                  <Search size={14} />
                </button>
              </div>

              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#10B981] cursor-pointer transition-colors"
              >
                <option value="">-- Tất cả Quận/Huyện Hà Nội --</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* Sport Filter */}
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#10B981] cursor-pointer transition-colors"
              >
                <option value="">-- Tất cả bộ môn thể thao --</option>
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Court Clusters List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clusters.length > 0 ? (
              clusters.map(cluster => (
                <div 
                  key={cluster.id}
                  onClick={() => handleSelectCluster(cluster.id)}
                  className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#10B981]/50 transition-all cursor-pointer flex flex-col group h-full shadow-xs hover:shadow-md"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img 
                      src={cluster.imageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"} 
                      alt={cluster.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const name = (cluster.name || "").toLowerCase();
                        const desc = (cluster.description || "").toLowerCase();
                        if (name.includes("cầu lông") || name.includes("badminton") || desc.includes("cầu lông")) {
                          target.src = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80";
                        } else if (name.includes("tennis") || name.includes("quần vợt") || desc.includes("tennis")) {
                          target.src = "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80";
                        } else if (name.includes("pickleball") || name.includes("pickle") || desc.includes("pickle")) {
                          target.src = "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80";
                        } else {
                          target.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#064E3B] border border-[#E2E8F0] flex items-center gap-1 shadow-xs">
                      <MapPin size={10} className="text-[#10B981]" />
                      {cluster.districtName}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-display font-bold text-slate-800 group-hover:text-[#10B981] transition-colors line-clamp-1">{cluster.name}</h3>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{cluster.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div className="flex gap-1">
                        {cluster.sports?.map((s: any) => (
                          <span key={s.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200" title={s.name}>
                            {getSportIcon(s.id)}
                          </span>
                        ))}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Giá từ</span>
                        <span className="text-xs font-bold text-[#10B981]">{formatVND(cluster.minPrice)}/h</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
                <p className="text-sm text-slate-500">Không tìm thấy cụm sân thể thao nào khớp với bộ lọc tại Hà Nội!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cluster Detailed Selection & Booking Slot Engine */}
      {activeTab === 'search' && selectedCluster && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCluster(null)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#10B981] transition-colors cursor-pointer font-semibold"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách cụm sân
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Cluster Details & Slots Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cluster Meta */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
                <div className="h-48 md:h-64 relative bg-slate-100">
                  <img 
                    src={selectedCluster.imageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"} 
                    alt={selectedCluster.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const name = (selectedCluster.name || "").toLowerCase();
                      const desc = (selectedCluster.description || "").toLowerCase();
                      if (name.includes("cầu lông") || name.includes("badminton") || desc.includes("cầu lông")) {
                        target.src = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80";
                      } else if (name.includes("tennis") || name.includes("quần vợt") || desc.includes("tennis")) {
                        target.src = "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80";
                      } else if (name.includes("pickleball") || name.includes("pickle") || desc.includes("pickle")) {
                        target.src = "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80";
                      } else {
                        target.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="bg-[#10B981]/20 backdrop-blur-md text-[#10B981] border border-[#10B981]/30 text-[10px] px-2.5 py-0.5 rounded-md font-bold mb-2 inline-block shadow-xs">
                      {selectedCluster.districtName}
                    </span>
                    <h1 className="text-lg md:text-xl font-display font-extrabold text-white leading-tight">{selectedCluster.name}</h1>
                    <p className="text-slate-200 text-xs mt-1 flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#10B981]" />
                      {selectedCluster.address}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả cụm sân</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedCluster.description}</p>
                  </div>

                  {/* Sân con selector */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn Sân Con (Sân đấu chi tiết)</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCluster.courts?.map((court: any) => (
                        <button
                          key={court.id}
                          onClick={() => setSelectedCourt(court)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            selectedCourt?.id === court.id
                              ? 'bg-[#10B981]/10 border-[#10B981] text-[#064E3B] font-extrabold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {getSportIcon(court.sportId)}
                          <span>{court.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({formatVND(court.basePrice)}/h)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slots Engine Grid */}
              {selectedCourt && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-display font-extrabold text-slate-800">Bảng chọn khung giờ vàng trống</h3>
                      <p className="text-xs text-slate-500">Xem trạng thái sân trống theo thời gian thực</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                      <Calendar size={14} className="text-[#10B981]" />
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time slot labels explanation */}
                  <div className="flex flex-wrap gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 block"></span>
                      <span>Sân trống</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded-md bg-amber-500/10 border border-amber-500/30 block"></span>
                      <span>Giờ vàng (⚡)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200 block"></span>
                      <span>Đã có người đặt</span>
                    </div>
                  </div>

                  {/* Slots Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {courtSlots.map(slot => {
                      const isSelectedStart = selectedHour === slot.hour;
                      const isSelectedRange = selectedHour !== null && endHour !== null && slot.hour >= selectedHour && slot.hour < endHour;
                      
                      let btnClass = '';
                      if (slot.isBooked) {
                        btnClass = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70';
                      } else if (isSelectedRange) {
                        btnClass = 'bg-[#10B981] border-[#10B981] text-white font-bold shadow-xs';
                      } else if (slot.isPeak) {
                        btnClass = 'bg-amber-500/5 border-amber-500/20 text-amber-600 hover:border-amber-500 hover:bg-amber-500/10';
                      } else {
                        btnClass = 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
                      }

                      return (
                        <button
                          key={slot.hour}
                          disabled={slot.isBooked}
                          onClick={() => {
                            if (selectedHour === null) {
                              setSelectedHour(slot.hour);
                              setEndHour(slot.hour + 1);
                            } else if (slot.hour >= selectedHour) {
                              // Check if intermediate slots are booked
                              const conflict = courtSlots.some(s => s.isBooked && s.hour >= selectedHour && s.hour <= slot.hour);
                              if (conflict) {
                                setSelectedHour(slot.hour);
                                setEndHour(slot.hour + 1);
                              } else {
                                setEndHour(slot.hour + 1);
                              }
                            } else {
                              setSelectedHour(slot.hour);
                              setEndHour(slot.hour + 1);
                            }
                          }}
                          className={`p-3.5 border rounded-xl text-xs text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${btnClass}`}
                        >
                          <span className="font-semibold">{slot.label}</span>
                          <span className="text-[10px] opacity-90">{formatVND(slot.price)}</span>
                          {slot.isPeak && !slot.isBooked && !isSelectedRange && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1 rounded flex items-center gap-0.5 border border-amber-500/10">
                              ⚡ Peak
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Cart / Summary & Right side rules */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-display font-bold text-slate-800 border-b border-slate-100 pb-3">Chi tiết đặt lịch</h3>

                {selectedCourt && selectedHour !== null && endHour !== null ? (
                  <div className="space-y-4">
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cụm sân:</span>
                        <span className="text-slate-800 font-bold">{selectedCluster.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sân con:</span>
                        <span className="text-slate-800 font-bold">{selectedCourt.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngày đặt:</span>
                        <span className="text-[#10B981] font-bold">{bookingDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Khung giờ chọn:</span>
                        <span className="text-slate-800 font-bold">{selectedHour}:00 - {endHour}:00 ({endHour - selectedHour} tiếng)</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-semibold">Tổng cộng:</span>
                      <span className="text-base font-display font-extrabold text-[#10B981]">{formatVND(calculateBookingPrice())}</span>
                    </div>

                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="w-full bg-[#10B981] hover:bg-[#064E3B] text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-xs cursor-pointer text-center block"
                    >
                      Tiến hành đặt lịch ngay
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 space-y-2">
                    <Clock size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs">Vui lòng chọn cụ thể khung giờ trống trên bảng lịch để đặt sân con!</p>
                  </div>
                )}
              </div>

              {/* Peak Hour Policies */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-xs">
                <h4 className="text-xs font-extrabold text-[#064E3B] uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-[#10B981]" />
                  Chính sách giờ vàng SportZone
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Khung giờ vàng tại Hà Nội (<strong>17:00 - 21:00</strong>) có hệ số nhân giá 1.3 (+30% so với giá cơ bản).</li>
                  <li>Lịch đã đặt có thể tự hủy miễn phí trên mục lịch sử cá nhân trước khi giờ thi đấu diễn ra ít nhất 4 tiếng.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking History View */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-display font-extrabold text-[#064E3B]">Lịch sử đặt sân thể thao Hà Nội</h2>
            <p className="text-xs text-slate-500">Theo dõi thông tin vé, lịch thi đấu và trạng thái thanh toán</p>
          </div>

          <div className="space-y-4">
            {bookingHistory.length > 0 ? (
              bookingHistory.map(booking => {
                let statusBadge = '';
                if (booking.status === 'pending_payment') {
                  statusBadge = 'bg-amber-50 text-amber-600 border-amber-200';
                } else if (booking.status === 'paid') {
                  statusBadge = 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
                } else if (booking.status === 'checked_in') {
                  statusBadge = 'bg-blue-50 text-blue-600 border-blue-200';
                } else {
                  statusBadge = 'bg-rose-50 text-rose-600 border-rose-200';
                }

                const displayStatus = {
                  pending_payment: 'Chờ thanh toán',
                  paid: 'Đã thanh toán',
                  checked_in: 'Đã chơi / Check-in',
                  cancelled: 'Đã hủy'
                }[booking.status as BookingStatus];

                return (
                  <div 
                    key={booking.id}
                    className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold py-0.5 px-2.5 rounded-full border ${statusBadge}`}>
                          {displayStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Mã: {booking.id}</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-display font-bold text-slate-800">{booking.clusterName} - {booking.courtName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {booking.address}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#10B981]" />
                          <span>Ngày chơi: <strong>{booking.bookingDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[#10B981]" />
                          <span>Giờ: <strong>{booking.startHour}:00 - {booking.endHour}:00</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-200 pt-4 md:pt-0 justify-between md:justify-end">
                      <div className="md:text-right">
                        <span className="text-[10px] text-slate-400 block">Tổng tiền</span>
                        <span className="text-sm font-display font-extrabold text-[#10B981]">{formatVND(booking.totalPrice)}</span>
                      </div>

                      {(booking.status === 'pending_payment' || booking.status === 'paid') && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="py-1.5 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          Hủy đặt sân
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Bạn chưa có lịch đặt sân nào trên hệ thống SportZone Hà Nội!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trợ lý AI SportZone */}
      {activeTab === 'ai' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-teal-50 to-[#10B981]/10 text-[#10B981] flex items-center justify-center border border-[#10B981]/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-display font-extrabold text-[#064E3B]">Trợ lý ảo SportZone Hà Nội</h3>
              <p className="text-[10px] text-slate-500 font-medium">Powered by Gemini - Tư vấn đặt sân, khung giờ rảnh & bản đồ Hà Nội</p>
            </div>
          </div>

          {/* Chat box body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {aiChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed space-y-2 whitespace-pre-wrap shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#10B981] text-white rounded-br-none font-semibold'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text.split('\n').map((line, lIdx) => {
                    // Very simple custom bolding formatter for styling markdown response inside the chat bubble
                    let formatted = line;
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    let match;
                    const elements: React.ReactNode[] = [];
                    let lastIndex = 0;
                    
                    while ((match = boldRegex.exec(line)) !== null) {
                      if (match.index > lastIndex) {
                        elements.push(line.substring(lastIndex, match.index));
                      }
                      elements.push(<strong key={match.index} className="text-slate-900 font-extrabold">{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    if (lastIndex < line.length) {
                      elements.push(line.substring(lastIndex));
                    }

                    return (
                      <p key={lIdx}>
                        {elements.length > 0 ? elements : line}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 p-4 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-200"></span>
                  <span className="font-medium">Đang phân tích sân bãi Hà Nội...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input footer */}
          <form onSubmit={handleSendAi} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={aiInput}
              disabled={aiLoading}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Hỏi AI: 'Tôi muốn đặt sân bóng đá Đống Đa giá sinh viên'..."
              className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-colors"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="bg-[#10B981] hover:bg-[#064E3B] text-white p-2.5 rounded-xl cursor-pointer transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Real-time Dynamic Checkout Simulator Modal */}
      {isBookingModalOpen && selectedCluster && selectedCourt && selectedHour !== null && endHour !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full overflow-hidden shadow-xl relative">
            <button 
              onClick={() => { setIsBookingModalOpen(false); setBookingSuccess(null); setBookingError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            {!bookingSuccess ? (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-sm font-display font-extrabold text-slate-800 flex items-center gap-2">
                    <CreditCard className="text-[#10B981]" size={18} />
                    Giả lập Cổng Thanh Toán Trực Tuyến
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Đơn hàng giữ chỗ thời gian thực trong 10 phút</p>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-semibold">
                    {bookingError}
                  </div>
                )}

                {/* Bill details */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Cụm sân:</span>
                    <span className="text-slate-800 font-bold">{selectedCluster.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Sân con:</span>
                    <span className="text-slate-800 font-bold">{selectedCourt.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Thời gian đặt:</span>
                    <span className="text-slate-800 font-bold">{selectedHour}:00 - {endHour}:00, {bookingDate}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold">
                    <span className="text-slate-600">Thành tiền:</span>
                    <span className="text-[#10B981] text-sm font-display font-extrabold">{formatVND(calculateBookingPrice())}</span>
                  </div>
                </div>

                {/* Payment option tabs */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn cổng thanh toán</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'momo'
                          ? 'bg-pink-50 border-pink-200 text-pink-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">MoMo QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('vnpay')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'vnpay'
                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">VNPay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        paymentMethod === 'transfer'
                          ? 'bg-amber-50 border-amber-200 text-amber-600 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">Chuyển Khoản</span>
                    </button>
                  </div>
                </div>

                {/* Payment dynamic contents */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                  {paymentMethod === 'momo' && (
                    <>
                      <div className="bg-white p-2 border border-slate-200 rounded-xl">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SZ_MOMO_MOCK" 
                          alt="Momo Mock QR"
                          className="w-28 h-28"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Quét mã QR MoMo giả lập bằng camera điện thoại của bạn để khớp đơn tự động</p>
                    </>
                  )}
                  {paymentMethod === 'vnpay' && (
                    <>
                      <div className="bg-white p-2 border border-slate-200 rounded-xl">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SZ_VNPAY_MOCK" 
                          alt="VNPay Mock QR"
                          className="w-28 h-28"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Cổng thanh toán VNPay - Quét thanh toán ứng dụng ngân hàng di động</p>
                    </>
                  )}
                  {paymentMethod === 'transfer' && (
                    <div className="text-left w-full text-xs space-y-2.5 font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Ngân hàng:</span>
                        <span className="text-slate-800 font-bold">Vietcombank Hà Nội</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Số tài khoản:</span>
                        <span className="text-slate-800 font-mono font-bold">10123456789</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                        <span className="text-slate-800 font-semibold">CONG TY TNHH SPORTZONE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Nội dung chuyển:</span>
                        <span className="text-[#10B981] font-mono font-extrabold">SZ_BOOKING_{Date.now().toString().slice(-6)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookingSubmit}
                  disabled={bookingLoading}
                  className="w-full bg-[#10B981] hover:bg-[#064E3B] text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  {bookingLoading ? 'Đang thực hiện giao dịch giữ chỗ...' : 'Xác nhận Đã Chuyển Khoản / Quét QR'}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h3 className="text-base font-display font-extrabold text-[#064E3B]">Đặt sân thành công tại Hà Nội!</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Thông tin vé đặt sân của bạn đã được lưu vết thành công trên hệ thống</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Mã đặt sân:</span>
                    <span className="text-[#10B981] font-mono font-extrabold">{bookingSuccess.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Ngày chơi:</span>
                    <span className="text-slate-800 font-bold">{bookingSuccess.bookingDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Thời gian:</span>
                    <span className="text-slate-800 font-bold">{bookingSuccess.startHour}:00 - {bookingSuccess.endHour}:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Trạng thái:</span>
                    <span className="text-[#10B981] font-bold">Đã thanh toán (Paid)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setBookingSuccess(null);
                    setSelectedCluster(null);
                    setActiveTab('history');
                  }}
                  className="w-full bg-[#10B981] hover:bg-[#064E3B] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
                >
                  Xem lịch sử đặt sân của tôi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && user && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-display font-extrabold text-2xl border border-[#10B981]/20">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-display font-extrabold text-[#064E3B]">{user.fullName}</h2>
              <p className="text-xs text-slate-500 font-medium">Tên đăng nhập: @{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số điện thoại</span>
              <span className="text-xs font-bold text-slate-800">{user.phone}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cấp độ tài khoản</span>
              <span className="text-xs font-bold text-[#10B981]">Thành viên Người chơi</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày tham gia hệ thống</span>
              <span className="text-xs font-bold text-slate-800">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa phương hoạt động</span>
              <span className="text-xs font-bold text-slate-800">TP. Hà Nội</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Thống kê hoạt động thể thao</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#10B981]/5 border border-[#10B981]/10 p-3.5 rounded-xl text-center">
                <span className="text-lg font-display font-extrabold text-[#064E3B] block">{bookingHistory.length}</span>
                <span className="text-[9px] font-bold text-[#10B981] uppercase">Tổng lượt đặt</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-center">
                <span className="text-lg font-display font-extrabold text-blue-800 block">
                  {bookingHistory.filter(b => b.status === 'checked_in').length}
                </span>
                <span className="text-[9px] font-bold text-blue-600 uppercase">Đã hoàn thành</span>
              </div>
              <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-xl text-center flex flex-col justify-center items-center">
                <span className="text-xs font-display font-extrabold text-purple-800 block leading-tight truncate w-full">
                  {formatVND(bookingHistory.reduce((acc, b) => b.status === 'paid' || b.status === 'checked_in' ? acc + b.totalPrice : acc, 0))}
                </span>
                <span className="text-[9px] font-bold text-purple-600 uppercase mt-1">Đã chi tiêu</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
