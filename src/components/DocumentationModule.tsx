import React, { useState } from 'react';
import { TECHNICAL_DOC } from '../data/documentation';
import { BookOpen, Database, ShieldAlert, Key, HelpCircle, FileDown, CheckCircle, Flame, Activity, Sparkles, Target } from 'lucide-react';

export default function DocumentationModule() {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'schema' | 'faq'>('text');

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-extrabold text-[#064E3B] flex items-center gap-2">
            <BookOpen className="text-[#10B981]" size={20} />
            Hồ sơ Dự án & Tài liệu Kỹ thuật
          </h2>
          <p className="text-xs text-slate-500 font-medium">Tài liệu phục vụ Bài tập lớn môn Quản lý dự án CNTT</p>
        </div>
        
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveSubTab('text')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'text'
                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#064E3B]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={14} />
            Mô tả Nghiệp vụ
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'schema'
                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#064E3B]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Database size={14} />
            Database Schema (3NF)
          </button>
          <button
            onClick={() => setActiveSubTab('faq')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'faq'
                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#064E3B]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <HelpCircle size={14} />
            Cẩm nang Phản biện
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeSubTab === 'text' && (
          <div className="prose max-w-none text-slate-700 space-y-6 text-sm">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3 shadow-xs">
              <CheckCircle className="text-[#10B981] shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-extrabold text-[#064E3B] text-sm mb-1">Thiết kế chuẩn hóa bởi Chuyên gia BA/SA</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tài liệu kỹ thuật dưới đây đã được tinh chỉnh để bám sát 100% yêu cầu nghiệp vụ thực tế của thị trường Hà Nội, giải quyết triệt để vấn nạn trùng lịch (Overbooking) và định giá động. Sinh viên có thể sao chép trực tiếp vào báo cáo word của môn học.
                </p>
              </div>
            </div>

            <div className="space-y-6 whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
              {TECHNICAL_DOC.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return <h2 key={idx} className="text-xl font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-2 mt-4">{paragraph.replace('# ', '')}</h2>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h3 key={idx} className="text-lg font-display font-extrabold text-[#10B981] mt-6">{paragraph.replace('## ', '')}</h3>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h4 key={idx} className="text-sm font-display font-bold text-slate-800 mt-4">{paragraph.replace('### ', '')}</h4>;
                }
                if (paragraph.startsWith('> ')) {
                  return <div key={idx} className="pl-4 border-l-2 border-[#10B981] text-slate-500 italic my-2 font-medium">{paragraph.replace('> ', '')}</div>;
                }
                if (paragraph.startsWith('```sql')) {
                  return (
                    <pre key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto text-xs font-mono text-[#064E3B] my-4 shadow-xs">
                      <code>{paragraph.replace('```sql\n', '').replace('```', '')}</code>
                    </pre>
                  );
                }
                if (paragraph.startsWith('```typescript')) {
                  return (
                    <pre key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto text-xs font-mono text-teal-700 my-4 shadow-xs">
                      <code>{paragraph.replace('```typescript\n', '').replace('```', '')}</code>
                    </pre>
                  );
                }
                return <p key={idx} className="text-slate-600">{paragraph}</p>;
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-display font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                <Database className="text-[#10B981]" size={16} />
                Sơ đồ Thực thể Quan hệ 3NF (Bản rút gọn cấu trúc)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Table 1 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">quan_huyen (Quận/Huyện)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li>ten_quan (VARCHAR) [UNIQUE]</li>
                  </ul>
                </div>

                {/* Table 2 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">bo_mon (Bộ môn thể thao)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li>ten_bo_mon (VARCHAR)</li>
                    <li>icon_name (VARCHAR)</li>
                  </ul>
                </div>

                {/* Table 3 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">nguoi_dung (Người dùng)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li>username (VARCHAR) [UNIQUE]</li>
                    <li>password_hash (VARCHAR)</li>
                    <li>ho_ten (VARCHAR)</li>
                    <li>so_dien_thoai (VARCHAR)</li>
                    <li>vai_tro (VARCHAR) [customer/owner/admin]</li>
                  </ul>
                </div>

                {/* Table 4 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">cum_san (Cụm sân thể thao)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li><span className="text-cyan-600 font-bold">🔗 owner_id</span> (FK nguoi_dung.id)</li>
                    <li>ten_cum_san (VARCHAR)</li>
                    <li><span className="text-cyan-600 font-bold">🔗 quan_huyen_id</span> (FK quan_huyen.id)</li>
                    <li>dia_chi_chi_tiet (VARCHAR)</li>
                    <li>trang_thai (VARCHAR)</li>
                  </ul>
                </div>

                {/* Table 5 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">san_con (Sân con)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li><span className="text-cyan-600 font-bold">🔗 cum_san_id</span> (FK cum_san.id)</li>
                    <li>ten_san (VARCHAR)</li>
                    <li><span className="text-cyan-600 font-bold">🔗 bo_mon_id</span> (FK bo_mon.id)</li>
                    <li>gia_co_ban (DECIMAL)</li>
                  </ul>
                </div>

                {/* Table 6 */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                  <div className="font-display font-extrabold text-[#064E3B] border-b border-slate-100 pb-1 mb-2">lich_dat (Lịch đặt sân)</div>
                  <ul className="space-y-1 font-mono text-slate-600 font-medium">
                    <li><span className="text-rose-600 font-extrabold">🔑 id</span> (VARCHAR) [PK]</li>
                    <li><span className="text-cyan-600 font-bold">🔗 customer_id</span> (FK nguoi_dung.id)</li>
                    <li><span className="text-cyan-600 font-bold">🔗 san_con_id</span> (FK san_con.id)</li>
                    <li>ngay_dat (DATE)</li>
                    <li>gio_bat_dau (INT)</li>
                    <li>gio_ket_thuc (INT)</li>
                    <li>tong_tien (DECIMAL)</li>
                    <li>trang_thai (VARCHAR)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-xs">
              <h4 className="text-sm font-display font-extrabold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-rose-600" size={16} />
                Cú Pháp SQL Ngăn Ngừa Trùng Lịch (Overbooking Check)
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Khi có yêu cầu đặt sân con <code className="text-cyan-600 font-mono font-bold">san_con_id</code> vào ngày <code className="text-cyan-600 font-mono font-bold">ngay_dat</code> trong khung giờ <code className="text-cyan-600 font-mono font-bold">[:startHour, :endHour]</code>, hệ thống sẽ chạy truy vấn sau để xem đã có bản ghi nào trùng khít hay chưa:
              </p>
              <pre className="bg-white p-3.5 rounded-lg text-xs font-mono text-cyan-700 overflow-x-auto border border-slate-200 shadow-xs">
{`SELECT COUNT(*) FROM lich_dat
WHERE san_con_id = :courtId
  AND ngay_dat = :bookingDate
  AND trang_thai != 'cancelled'
  -- ĐIỀU KIỆN GIAO THOÀ TRÙNG LỊCH:
  AND :startHour < gio_ket_thuc 
  AND gio_bat_dau < :endHour;`}
              </pre>
            </div>
          </div>
        )}

        {activeSubTab === 'faq' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-slate-800 font-display font-bold text-sm mb-2">💡 Câu hỏi 1: Tại sao chúng ta lại chia cụm sân (CourtCluster) và sân con (Court)?</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                <strong>Trả lời:</strong> Đây là thiết kế chuẩn 1-N (Một - Nhiều). Một cụm sân (Ví dụ: Cụm sân Cầu lông Cầu Giấy) gồm nhiều sân con riêng biệt (Sân 1, Sân 2, Sân 3) cùng nằm trên một mặt bằng địa lý. Thiết kế này giúp người dùng dễ tìm kiếm theo địa chỉ cụm, nhưng khi đặt lịch thì đặt chính xác trên từng sân con để tránh trùng lặp.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-slate-800 font-display font-bold text-sm mb-2">💡 Câu hỏi 2: Vai trò của bảng 'khung_gio_vang' (Pricing Rules) là gì?</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                <strong>Trả lời:</strong> Bảng này lưu trữ cấu hình tăng giá động theo giờ (Dynamic Pricing). Thông thường các khung giờ vàng như 17h - 21h hàng ngày sẽ đông đúc nhất, chủ sân thiết lập hệ số tăng giá (ví dụ: 1.3 - tăng 30%) để cân bằng cung cầu và gia tăng lợi nhuận.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-slate-800 font-display font-bold text-sm mb-2">💡 Câu hỏi 3: Quy trình thanh toán trực tuyến được giả lập ra sao?</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                <strong>Trả lời:</strong> Trong bài tập lớn, chúng ta tích hợp module giả lập cổng thanh toán có hiển thị mã QR kèm thông tin chuyển khoản nội dung đúng cú pháp đặt sân (<code className="text-[#10B981] font-mono font-bold">SZ_BookingID</code>). Sau khi khách nhấn xác nhận đã chuyển, backend cập nhật trạng thái lịch thành <code className="text-[#10B981] font-mono font-bold">paid</code> (Đã thanh toán) ngay lập tức nhằm đem lại trải nghiệm trọn vẹn.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
