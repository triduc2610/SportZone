import React, { useState } from 'react';
import { TECHNICAL_DOC } from '../data/documentation';
import { 
  BookOpen, Database, ShieldAlert, HelpCircle, CheckCircle, Flame, 
  Activity, Sparkles, Target, Copy, Check, GitFork, 
  Info, Layers 
} from 'lucide-react';

export default function DocumentationModule() {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'schema' | 'diagrams' | 'faq'>('text');
  const [selectedDiagram, setSelectedDiagram] = useState<'class' | 'seq_customer' | 'seq_owner' | 'seq_admin'>('seq_customer');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CLASS_DIAGRAM_MERMAID = `classDiagram
    class nguoi_dung {
        +id: VARCHAR(50) [PK]
        +username: VARCHAR(100) [UNIQUE]
        +password_hash: VARCHAR(255)
        +ho_ten: VARCHAR(150)
        +so_dien_thoai: VARCHAR(15)
        +vai_tro: VARCHAR(20) [customer/owner/admin]
        +ngay_tao: TIMESTAMP
        +dangKy(username, password, hoTen, sdt, vaiTro) Boolean
        +dangNhap(username, password) User
        +capNhatThongTin(hoTen, sdt) Boolean
        +doiMatKhau(oldPass, newPass) Boolean
        +layThongTin(id) User
        +xoaTaiKhoan(id) Boolean
    }

    class quan_huyen {
        +id: VARCHAR(50) [PK]
        +ten_quan: VARCHAR(100) [UNIQUE]
        +themQuan(tenQuan) Boolean
        +capNhatQuan(id, tenQuan) Boolean
        +xoaQuan(id) Boolean
        +layDanhSach() List~District~
    }

    class bo_mon {
        +id: VARCHAR(50) [PK]
        +ten_bo_mon: VARCHAR(50) [UNIQUE]
        +icon_name: VARCHAR(50)
        +themBoMon(tenBoMon, iconName) Boolean
        +capNhatBoMon(id, tenBoMon, iconName) Boolean
        +xoaBoMon(id) Boolean
        +layDanhSach() List~Sport~
    }

    class cum_san {
        +id: VARCHAR(50) [PK]
        +owner_id: VARCHAR(50) [FK]
        +ten_cum_san: VARCHAR(150)
        +quan_huyen_id: VARCHAR(50) [FK]
        +dia_chi_chi_tiet: VARCHAR(255)
        +image_url: VARCHAR(255)
        +mo_ta: TEXT
        +trang_thai: VARCHAR(20) [pending/approved/rejected]
        +ngay_tao: TIMESTAMP
        +dangKyCumSan(ownerId, tenCum, districtId, diaChi, image, moTa) String
        +capNhatCumSan(id, tenCum, diaChi, image, moTa) Boolean
        +xoaCumSan(id) Boolean
        +pheDuyetCumSan(id, isApproved) Boolean
        +layCumSanTheoOwner(ownerId) List~Cluster~
        +timKiemCumSan(districtId, sportId) List~Cluster~
    }

    class san_con {
        +id: VARCHAR(50) [PK]
        +cum_san_id: VARCHAR(50) [FK]
        +ten_san: VARCHAR(100)
        +bo_mon_id: VARCHAR(50) [FK]
        +gia_co_ban: DECIMAL
        +themSanCon(cumSanId, tenSan, boMonId, giaCoBan) Boolean
        +capNhatSanCon(id, tenSan, giaCoBan) Boolean
        +xoaSanCon(id) Boolean
        +laySanConTheoCum(cumSanId) List~Court~
        +layKhungGioTrong(id, ngay) List~Hours~
    }

    class khung_gio_vang {
        +id: VARCHAR(50) [PK]
        +cum_san_id: VARCHAR(50) [FK]
        +gio_bat_dau: INT
        +gio_ket_thuc: INT
        +he_so_gia: DECIMAL
        +themKhungGioVang(cumSanId, start, end, mult) Boolean
        +capNhatKhungGio(id, start, end, mult) Boolean
        +xoaKhungGio(id) Boolean
        +tinhGiaThue(courtId, start, end) Decimal
    }

    class lich_dat {
        +id: VARCHAR(50) [PK]
        +customer_id: VARCHAR(50) [FK]
        +san_con_id: VARCHAR(50) [FK]
        +ngay_dat: DATE
        +gio_bat_dau: INT
        +gio_ket_thuc: INT
        +tong_tien: DECIMAL
        +trang_thai: VARCHAR(30)
        +phuong_thuc_thanh_toan: VARCHAR(50)
        +ngay_tao: TIMESTAMP
        +taoYeuCauDat(customerId, courtId, ngay, start, end) String
        +kiemTraTrungLich(courtId, ngay, start, end) Boolean
        +xacNhanThanhToan(id, paymentMethod) Boolean
        +huyLichDat(id, lyDo) Boolean
        +layLichDatCuaKhach(customerId) List~Booking~
        +layDoanhThuChuSan(ownerId) Decimal
    }

    nguoi_dung "1" -- "0..*" cum_san : "Quản lý (owner_id)"
    nguoi_dung "1" -- "0..*" lich_dat : "Đặt lịch (customer_id)"
    quan_huyen "1" -- "0..*" cum_san : "Thuộc về (quan_huyen_id)"
    bo_mon "1" -- "0..*" san_con : "Áp dụng (bo_mon_id)"
    cum_san "1" -- "0..*" san_con : "Bao gồm (cum_san_id)"
    cum_san "1" -- "0..*" khung_gio_vang : "Cấu hình (cum_san_id)"
    san_con "1" -- "0..*" lich_dat : "Được đặt (san_con_id)"`;

  const SEQ_CUSTOMER_MERMAID = `sequenceDiagram
    autonumber
    actor KH as Khách hàng (Customer)
    participant FE as Giao diện (Frontend)
    participant BE as Máy chủ (Backend API)
    participant DB as Cơ sở dữ liệu (Database)
    participant PG as Cổng Thanh Toán (Payment Gateway)

    %% 1. TÌM KIẾM SÂN
    Note over KH, DB: Quy trình 1: Tìm kiếm Sân
    KH->>FE: Nhập quận/huyện, bộ môn, thời gian & Tìm kiếm
    FE->>BE: GET /api/clusters?district=DistrictId&sport=SportId
    BE->>DB: Query các cụm sân & sân con còn trống
    DB-->>BE: Trả về danh sách sân con & bảng giá cơ bản
    BE-->>FE: Phản hồi danh sách cụm sân tương thích
    FE-->>KH: Hiển thị danh sách cụm sân & bộ lọc thông minh

    %% 2. ĐẶT SÂN
    Note over KH, DB: Quy trình 2: Đặt Sân & Chống Trùng Lịch (Anti-Overbooking)
    KH->>FE: Chọn sân con, ngày đặt, khung giờ & nhấn "Đặt Sân"
    FE->>BE: POST /api/bookings (courtId, date, startHour, endHour)
    BE->>DB: TRANSACTION: Kiểm tra trùng lịch (Overlap Check)
    Note over BE, DB: SELECT COUNT(*) FROM lich_dat WHERE san_con_id = :id AND ...
    DB-->>BE: Kết quả kiểm tra (Ví dụ: Count = 0)
    alt Có trùng lịch (Overlapping detected)
        BE-->>FE: Trả về lỗi 409 (Khung giờ đã được đặt)
        FE-->>KH: Hiển thị cảnh báo "Khung giờ đã có người đặt, vui lòng chọn lại!"
    else Khung giờ trống (Available)
        BE->>DB: INSERT INTO lich_dat (id, customer_id, ..., trang_thai='pending_payment')
        DB-->>BE: Xác nhận đã lưu bản ghi tạm
        BE-->>FE: Phản hồi thông tin booking_id & nội dung chuyển khoản chuyển tiếp
    end

    %% 3. THANH TOÁN
    Note over KH, PG: Quy trình 3: Thanh toán trực tuyến
    FE->>FE: Tạo mã QR thanh toán động (SZ_BookingID)
    FE-->>KH: Hiển thị mã QR và hướng dẫn chuyển khoản
    KH->>PG: Quét QR & xác nhận chuyển khoản ngân hàng/ví điện tử
    PG->>BE: Webhook / IPN API cập nhật thanh toán thành công
    BE->>DB: UPDATE lich_dat SET trang_thai='paid' WHERE id=BookingID
    DB-->>BE: Xác nhận cập nhật thành công
    BE-->>FE: Đẩy tín hiệu cập nhật thời gian thực (WebSockets)
    FE-->>KH: Hiển thị thông báo "Đặt sân thành công! Lịch chơi đã được xác nhận"`;

  const SEQ_OWNER_MERMAID = `sequenceDiagram
    autonumber
    actor CS as Chủ sân (Court Owner)
    participant FE as Giao diện Chủ (Owner Portal)
    participant BE as Máy chủ (Backend API)
    participant DB as Cơ sở dữ liệu (Database)

    %% 1. ĐĂNG KÝ CỤM SÂN MỚI
    Note over CS, DB: Quy trình 1: Đăng ký Cụm sân mới
    CS->>FE: Nhập Tên cụm sân, Quận/Huyện, Địa chỉ chi tiết & Ảnh minh họa
    FE->>BE: POST /api/clusters (ten_cum_san, quan_huyen_id, dia_chi_chi_tiet, ...)
    Note over BE: Gán trạng thái mặc định = 'pending' (Chờ phê duyệt)
    BE->>DB: INSERT INTO cum_san (id, owner_id, ten_cum_san, trang_thai='pending')
    DB-->>BE: Xác nhận đã lưu thông tin cụm sân
    BE-->>FE: Phản hồi "Đăng ký thành công, đang chờ Quản trị viên phê duyệt"
    FE-->>CS: Hiển thị trạng thái "Chờ duyệt" của cụm sân mới

    %% 2. THÊM SÂN CON
    Note over CS, DB: Quy trình 2: Thêm Sân con vào Cụm sân
    CS->>FE: Nhập Tên sân con (ví dụ: Sân 1), chọn Bộ môn (Bóng đá), nhập Giá cơ bản
    FE->>BE: POST /api/courts (cum_san_id, ten_san, bo_mon_id, gia_co_ban)
    BE->>BE: Kiểm tra tính hợp lệ & quyền sở hữu cụm sân của Owner
    BE->>DB: INSERT INTO san_con (id, cum_san_id, ten_san, bo_mon_id, gia_co_ban)
    DB-->>BE: Xác nhận lưu sân con thành công
    BE-->>FE: Phản hồi thêm sân con thành công
    FE-->>CS: Cập nhật danh sách sân con hiển thị trên màn hình

    %% 3. CẤU HÌNH GIÁ (GIỜ VÀNG)
    Note over CS, DB: Quy trình 3: Cấu hình khung giờ vàng & Hệ số giá
    CS->>FE: Thiết lập khung giờ vàng (Ví dụ: 17h - 21h) & Hệ số giá (Hệ số: 1.3)
    FE->>BE: POST /api/pricing-rules (cum_san_id, gio_bat_dau, gio_ket_thuc, he_so_gia)
    BE->>BE: Validate logic: gio_bat_dau < gio_ket_thuc (0 - 23)
    BE->>DB: INSERT INTO khung_gio_vang (id, cum_san_id, gio_bat_dau, gio_ket_thuc, he_so_gia)
    DB-->>BE: Xác nhận lưu quy tắc cấu hình giá thành công
    BE-->>FE: Phản hồi cấu hình thành công
    FE-->>CS: Hiển thị bảng giá động đã được cấu hình trực quan`;

  const SEQ_ADMIN_MERMAID = `sequenceDiagram
    autonumber
    actor QTV as Quản trị viên (Admin)
    participant FE as Giao diện Admin (Admin Dashboard)
    participant BE as Máy chủ (Backend API)
    participant DB as Cơ sở dữ liệu (Database)

    %% 1. PHÊ DUYỆT CỤM SÂN
    Note over QTV, DB: Quy trình 1: Phê duyệt cụm sân thể thao mới
    QTV->>FE: Truy cập Danh sách cụm sân chờ phê duyệt
    FE->>BE: GET /api/admin/clusters (Lọc status='pending')
    BE->>DB: SELECT * FROM cum_san WHERE trang_thai = 'pending'
    DB-->>BE: Trả về danh sách các cụm sân đang chờ duyệt
    BE-->>FE: Phản hồi danh sách kèm thông tin chi tiết Chủ sân
    FE-->>QTV: Hiển thị danh sách cụm sân chờ duyệt trực quan
    QTV->>FE: Xem chi tiết & nhấn "Phê Duyệt" (Approve)
    FE->>BE: POST /api/admin/clusters/:clusterId/status (status='approved')
    BE->>DB: UPDATE cum_san SET trang_thai = 'approved' WHERE id = :clusterId
    DB-->>BE: Xác nhận cập nhật trạng thái thành công
    BE-->>FE: Phản hồi phê duyệt thành công (Cụm sân đã có thể tìm thấy bởi khách hàng)
    FE-->>QTV: Hiển thị thông báo thành công & xóa cụm sân khỏi hàng đợi chờ duyệt

    %% 2. ĐỐI SOÁT DOANH THU
    Note over QTV, DB: Quy trình 2: Đối soát Doanh thu hệ thống (Platform Revenue Audit)
    QTV->>FE: Truy cập Module Đối soát doanh thu hệ thống
    FE->>BE: GET /api/admin/stats
    BE->>DB: SELECT SUM(tong_tien) FROM lich_dat WHERE trang_thai = 'paid'
    DB-->>BE: Trả về tổng doanh thu gộp (Gross Revenue)
    BE->>DB: SELECT owner_id, SUM(tong_tien) FROM cum_san JOIN lich_dat ... GROUP BY owner_id
    DB-->>BE: Trả về bảng doanh thu gộp phân chia theo từng Chủ Sân
    BE->>BE: Tính toán phí hoa hồng nền tảng (Ví dụ: 10% Platform Fee)<br/>Tính số tiền thực nhận chuyển trả cho Chủ Sân (Net Payout = Gross * 90%)
    BE-->>FE: Phản hồi báo cáo đối soát tổng hợp (Doanh thu gộp, Phí nền tảng, Phải trả chủ sân)
    FE-->>QTV: Hiển thị biểu đồ doanh thu dạng Recharts & Bảng đối soát từng chủ sân chi tiết`;

  // Interactive Playthrough steps
  const seqSteps = {
    seq_customer: [
      {
        title: "1. Tìm kiếm sân trống",
        direction: "Khách hàng ➔ Frontend ➔ Backend ➔ DB",
        api: "GET /api/districts, GET /api/sports, GET /api/clusters",
        desc: "Khách hàng mở app, chọn Quận (vd: Cầu Giấy), chọn Bộ môn (vd: Cầu lông). Frontend gửi request đến Backend API. Backend truy vấn cơ sở dữ liệu để lọc các cụm sân có trạng thái 'approved' nằm ở quận đó và có sân con tương thích.",
        sql: "SELECT * FROM cum_san WHERE quan_huyen_id = 'cau_giay' AND trang_thai = 'approved';"
      },
      {
        title: "2. Chọn giờ & Đặt lịch",
        direction: "Khách hàng ➔ Frontend ➔ Backend",
        api: "POST /api/bookings",
        desc: "Khách hàng chọn sân con cụ thể, chọn ngày chơi và chọn khung giờ (ví dụ: 18h - 19h) rồi nhấn 'Đặt Sân'. Frontend gửi dữ liệu (courtId, date, startHour, endHour) lên Backend để bắt đầu quy trình đăng ký.",
        sql: "SELECT id FROM san_con WHERE id = :courtId;"
      },
      {
        title: "3. Chống trùng lịch (Anti-Overbooking)",
        direction: "Backend ➔ Database ➔ Backend",
        api: "SQL Transaction",
        desc: "Backend chạy một câu truy vấn SELECT COUNT(*) để kiểm tra xem đã có lịch đặt nào khác cùng sân con, cùng ngày đang hoạt động giao thoa khung giờ hay chưa. Nếu kết quả > 0, hệ thống từ chối lập tức với lỗi trùng lịch. Nếu bằng 0, Backend tạo bản ghi lịch đặt mới ở trạng thái 'pending_payment'.",
        sql: "SELECT COUNT(*) FROM lich_dat \nWHERE san_con_id = :courtId AND ngay_dat = :date \n  AND trang_thai != 'cancelled'\n  AND :startHour < gio_ket_thuc AND gio_bat_dau < :endHour;"
      },
      {
        title: "4. Trả về QR Thanh toán",
        direction: "Backend ➔ Frontend ➔ Khách hàng",
        api: "JSON Response",
        desc: "Backend lưu thành công lịch đặt tạm và gửi trả về thông tin bookingId kèm cấu trúc nội dung chuyển khoản chuẩn hóa (SZ_BookingID). Giao diện Frontend nhận dữ liệu, tạo mã QR MoMo hoặc ngân hàng động và hiển thị kèm đồng hồ đếm ngược.",
        sql: "INSERT INTO lich_dat (id, customer_id, san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc, tong_tien, trang_thai) \nVALUES (:id, :userId, :courtId, :date, :start, :end, :amount, 'pending_payment');"
      },
      {
        title: "5. Thanh toán trực tuyến",
        direction: "Khách hàng ➔ Ví MoMo/VNPay ➔ Backend",
        api: "Webhook / IPN Callback",
        desc: "Khách hàng thực hiện thanh toán. Ví điện tử hoặc Ngân hàng ghi nhận giao dịch thành công và gửi tín hiệu API (Webhook) hoặc khách hàng nhấn nút xác nhận đã chuyển, kích hoạt tiến trình xác thực tại máy chủ.",
        sql: "-- Lắng nghe tín hiệu callback từ đối tác thanh toán"
      },
      {
        title: "6. Hoàn tất & Đổi trạng thái",
        direction: "Backend ➔ Database ➔ Frontend",
        api: "UPDATE / WebSocket Push",
        desc: "Sau khi xác nhận thanh toán thành công, Backend cập nhật trạng thái lịch đặt thành 'paid' (Đã thanh toán) trong Database và đẩy tín hiệu WebSocket hoặc phản hồi giao diện. Sân con chính thức được khóa thành công, người chơi nhận được vé đặt sân.",
        sql: "UPDATE lich_dat SET trang_thai = 'paid', phuong_thuc_thanh_toan = 'momo' \nWHERE id = :bookingId;"
      }
    ],
    seq_owner: [
      {
        title: "1. Đăng ký Cụm sân mới",
        direction: "Chủ sân ➔ Frontend ➔ Backend ➔ DB",
        api: "POST /api/owner/clusters",
        desc: "Chủ sân gửi hồ sơ cụm sân mới gồm Tên cụm, Quận/Huyện, Địa chỉ chi tiết, Mô tả và Hình ảnh. Hệ thống gán trạng thái mặc định là 'pending' (Chờ phê duyệt) để gửi đến Admin kiểm duyệt chất lượng.",
        sql: "INSERT INTO cum_san (id, owner_id, ten_cum_san, quan_huyen_id, dia_chi_chi_tiet, trang_thai) \nVALUES (:id, :ownerId, :name, :districtId, :address, 'pending');"
      },
      {
        title: "2. Thêm sân con",
        direction: "Chủ sân ➔ Frontend ➔ Backend ➔ DB",
        api: "POST /api/owner/courts",
        desc: "Chủ sân bổ sung các sân đấu nhỏ (sân con) vào cụm sân của mình (Ví dụ: Sân 1, Sân 2). Mỗi sân con được gán với một bộ môn thể thao và đơn giá thuê cơ bản áp dụng cho giờ thường.",
        sql: "INSERT INTO san_con (id, cum_san_id, ten_san, bo_mon_id, gia_co_ban) \nVALUES (:id, :clusterId, :name, :sportId, :basePrice);"
      },
      {
        title: "3. Cấu hình quy tắc Giá",
        direction: "Chủ sân ➔ Frontend ➔ Backend ➔ DB",
        api: "POST /api/owner/pricing-rules",
        desc: "Chủ sân thiết lập chính sách định giá động (Dynamic Pricing) theo khung giờ cao điểm (ví dụ: giờ vàng từ 17h đến 21h tăng 30% giá - hệ số 1.3) để điều hòa tải lượng khách và tối ưu hóa doanh thu.",
        sql: "INSERT INTO khung_gio_vang (id, cum_san_id, gio_bat_dau, gio_ket_thuc, he_so_gia) \nVALUES (:id, :clusterId, :start, :end, :multiplier);"
      }
    ],
    seq_admin: [
      {
        title: "1. Tải danh sách Chờ duyệt",
        direction: "Admin ➔ Frontend ➔ Backend ➔ DB",
        api: "GET /api/admin/clusters?status=pending",
        desc: "Hệ thống quản trị viên tự động lấy ra danh sách các đề xuất cụm sân mới đăng ký từ các chủ sân có trạng thái chờ phê duyệt.",
        sql: "SELECT * FROM cum_san WHERE trang_thai = 'pending' ORDER BY ngay_tao DESC;"
      },
      {
        title: "2. Phê duyệt cụm sân",
        direction: "Admin ➔ Frontend ➔ Backend ➔ DB",
        api: "POST /api/admin/clusters/:id/status",
        desc: "Quản trị viên kiểm tra kỹ hồ sơ, hình ảnh thực tế và địa chỉ. Nếu đạt chuẩn, nhấn Phê duyệt. Backend cập nhật trạng thái cụm sân thành 'approved'. Từ giây phút này, cụm sân được hiển thị công khai trên ứng dụng cho khách hàng đặt lịch.",
        sql: "UPDATE cum_san SET trang_thai = 'approved' WHERE id = :clusterId;"
      },
      {
        title: "3. Đối soát Doanh thu hệ thống",
        direction: "Admin ➔ Frontend ➔ Backend ➔ DB",
        api: "GET /api/admin/stats",
        desc: "Hệ thống tổng hợp doanh thu đặt sân thành công (status = 'paid'). Tính toán phí hoa hồng nền tảng (ví dụ: 10% hoa hồng nền tảng từ doanh số đặt sân của các chủ sân) và xuất danh sách đối soát chi tiết số tiền cần chi trả (Net Payout) cho mỗi chủ sân.",
        sql: "SELECT c.owner_id, SUM(l.tong_tien) as gross_revenue \nFROM lich_dat l \nJOIN san_con s ON l.san_con_id = s.id \nJOIN cum_san c ON s.cum_san_id = c.id \nWHERE l.trang_thai = 'paid' \nGROUP BY c.owner_id;"
      }
    ]
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
      {/* Module Title Section */}
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-extrabold text-[#064E3B] flex items-center gap-2">
            <BookOpen className="text-[#10B981]" size={20} />
            Hồ sơ Dự án & Tài liệu Kỹ thuật
          </h2>
          <p className="text-xs text-slate-500 font-medium">Tài liệu phục vụ Bài tập lớn môn Quản lý dự án CNTT</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto overflow-x-auto shadow-xs">
          <button
            onClick={() => setActiveSubTab('text')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'schema'
                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#064E3B]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Database size={14} />
            Database Schema (3NF)
          </button>
          <button
            onClick={() => {
              setActiveSubTab('diagrams');
              setActiveStep(0);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'diagrams'
                ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#064E3B]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <GitFork size={14} />
            Biểu đồ UML (Mermaid)
          </button>
          <button
            onClick={() => setActiveSubTab('faq')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
        {/* TAB 1: BUSINESS DOC */}
        {activeSubTab === 'text' && (
          <div className="prose max-w-none text-slate-700 space-y-6 text-sm">
            <div className="p-4 bg-[#10B981]/5 border border-[#10B981]/10 rounded-xl flex items-start gap-3 shadow-xs">
              <CheckCircle className="text-[#10B981] shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-extrabold text-[#064E3B] text-sm mb-1 font-display">Thiết kế chuẩn hóa bởi Chuyên gia BA/SA</h4>
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

        {/* TAB 2: DATABASE SCHEMA */}
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

        {/* TAB 3: DIAGRAMS (NEW INTERACTIVE MERMAID & UML PLAYER) */}
        {activeSubTab === 'diagrams' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#10B981]/5 border border-[#10B981]/15 rounded-xl flex items-start gap-3">
              <Info className="text-[#10B981] shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold text-[#064E3B] text-sm mb-1 font-display">Trung tâm Biểu đồ Kiến trúc UML</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tại đây bạn có thể lấy mã nguồn Mermaid chính xác cho báo cáo và trực quan hóa từng quy trình nghiệp vụ thông qua trình phát hoạt ảnh tương tác bên dưới.
                </p>
              </div>
            </div>

            {/* Selector Bar */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => { setSelectedDiagram('seq_customer'); setActiveStep(0); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDiagram === 'seq_customer'
                    ? 'bg-[#10B981] text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👤 [Seq] Khách hàng: Đặt & Thanh toán
              </button>
              <button
                onClick={() => { setSelectedDiagram('seq_owner'); setActiveStep(0); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDiagram === 'seq_owner'
                    ? 'bg-[#10B981] text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏢 [Seq] Chủ sân: Cấu hình cụm & giá
              </button>
              <button
                onClick={() => { setSelectedDiagram('seq_admin'); setActiveStep(0); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDiagram === 'seq_admin'
                    ? 'bg-[#10B981] text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👑 [Seq] Admin: Duyệt & Đối soát
              </button>
              <button
                onClick={() => { setSelectedDiagram('class'); setActiveStep(0); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDiagram === 'class'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold border border-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📊 [Class] Biểu đồ Lớp CSDL 3NF
              </button>
            </div>

            {/* Main Diagram Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Mermaid Code View */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                  <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-slate-300 text-xs font-mono font-bold">
                    <span>{selectedDiagram === 'class' ? 'class_diagram.mermaid' : `${selectedDiagram}.mermaid`}</span>
                    <button
                      onClick={() => handleCopy(
                        selectedDiagram === 'class' ? CLASS_DIAGRAM_MERMAID :
                        selectedDiagram === 'seq_customer' ? SEQ_CUSTOMER_MERMAID :
                        selectedDiagram === 'seq_owner' ? SEQ_OWNER_MERMAID : SEQ_ADMIN_MERMAID,
                        selectedDiagram
                      )}
                      className="p-1 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === selectedDiagram ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedId === selectedDiagram ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto h-[400px] leading-relaxed">
                    <code>
                      {selectedDiagram === 'class' && CLASS_DIAGRAM_MERMAID}
                      {selectedDiagram === 'seq_customer' && SEQ_CUSTOMER_MERMAID}
                      {selectedDiagram === 'seq_owner' && SEQ_OWNER_MERMAID}
                      {selectedDiagram === 'seq_admin' && SEQ_ADMIN_MERMAID}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Right Column: Interactive Visual Previewer */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6 flex flex-col justify-between shadow-xs">
                
                {/* 1. If Class Diagram selected */}
                {selectedDiagram === 'class' && (
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-display font-extrabold text-[#064E3B] uppercase tracking-wider flex items-center gap-1.5">
                        <Database size={14} /> Trực quan hóa Sơ đồ Lớp (CSDL Chuẩn 3NF)
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-[#064E3B] px-2 py-0.5 rounded-full font-bold">7 Thực thể</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Sơ đồ lớp dưới đây mô tả mối quan hệ giữa các bảng trong hệ thống SportZone Hà Nội. Các đường liên kết thể hiện ràng buộc khóa ngoại (Foreign Key) chặt chẽ để đảm bảo toàn vẹn dữ liệu.
                    </p>

                    <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                      {/* Box 1: User */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>nguoi_dung (User)</span>
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-mono">1</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>username [Unique]</div>
                          <div>password_hash</div>
                          <div>ho_ten</div>
                          <div>vai_tro [customer/owner/admin]</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+dangKy(username, pass...)</div>
                          <div>+dangNhap(username, pass)</div>
                          <div>+capNhatThongTin(hoTen...)</div>
                          <div>+doiMatKhau(old, new)</div>
                          <div>+layThongTin(id)</div>
                          <div>+xoaTaiKhoan(id)</div>
                        </div>
                      </div>

                      {/* Box 2: District */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>quan_huyen (District)</span>
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-mono">1</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>ten_quan [Unique]</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+themQuan(tenQuan)</div>
                          <div>+capNhatQuan(id, ten)</div>
                          <div>+xoaQuan(id)</div>
                          <div>+layDanhSach()</div>
                        </div>
                      </div>

                      {/* Box 3: Sport */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>bo_mon (Sport)</span>
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-mono">1</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>ten_bo_mon [Unique]</div>
                          <div>icon_name</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+themBoMon(ten, icon)</div>
                          <div>+capNhatBoMon(id, ten...)</div>
                          <div>+xoaBoMon(id)</div>
                          <div>+layDanhSach()</div>
                        </div>
                      </div>

                      {/* Box 4: Cluster */}
                      <div className="bg-white p-3 rounded-lg border border-emerald-500 bg-emerald-50/5 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>cum_san (Cluster)</span>
                          <span className="text-[9px] text-cyan-600 bg-cyan-50 px-1.5 py-0.2 rounded font-mono">1:N</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>🔗 owner_id [FK]</div>
                          <div>ten_cum_san</div>
                          <div>🔗 quan_huyen_id [FK]</div>
                          <div>trang_thai</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+dangKyCumSan(ownerId...)</div>
                          <div>+capNhatCumSan(id, ten...)</div>
                          <div>+xoaCumSan(id)</div>
                          <div>+pheDuyetCumSan(id, approved)</div>
                          <div>+layCumSanTheoOwner(owner)</div>
                          <div>+timKiemCumSan(district, sport)</div>
                        </div>
                      </div>

                      {/* Box 5: Sub-Court */}
                      <div className="bg-white p-3 rounded-lg border border-emerald-500 bg-emerald-50/5 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>san_con (Court)</span>
                          <span className="text-[9px] text-cyan-600 bg-cyan-50 px-1.5 py-0.2 rounded font-mono">1:N</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>🔗 cum_san_id [FK]</div>
                          <div>ten_san</div>
                          <div>🔗 bo_mon_id [FK]</div>
                          <div>gia_co_ban</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+themSanCon(clusterId, ten...)</div>
                          <div>+capNhatSanCon(id, ten, gia)</div>
                          <div>+xoaSanCon(id)</div>
                          <div>+laySanConTheoCum(clusterId)</div>
                          <div>+layKhungGioTrong(id, ngay)</div>
                        </div>
                      </div>

                      {/* Box 6: Pricing Rule */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-2xs hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>khung_gio_vang (Pricing)</span>
                          <span className="text-[9px] text-cyan-600 bg-cyan-50 px-1.5 py-0.2 rounded font-mono">1:N</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 space-y-0.5 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>🔗 cum_san_id [FK]</div>
                          <div>gio_bat_dau</div>
                          <div>gio_ket_thuc</div>
                          <div>he_so_gia</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD):</div>
                        <div className="font-mono text-[9px] text-slate-500 space-y-0.5 leading-tight">
                          <div>+themKhungGioVang(cluster, start...)</div>
                          <div>+capNhatKhungGio(id, start...)</div>
                          <div>+xoaKhungGio(id)</div>
                          <div>+tinhGiaThue(courtId, start, end)</div>
                        </div>
                      </div>

                      {/* Box 7: Booking */}
                      <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/5 text-xs shadow-2xs col-span-2 hover:border-[#10B981] transition-colors">
                        <div className="font-bold text-[#064E3B] border-b pb-1 mb-1.5 flex items-center justify-between">
                          <span>lich_dat (Booking)</span>
                          <span className="text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-mono">N:1</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1 border-b pb-1.5 mb-1.5">
                          <div>🔑 id [PK]</div>
                          <div>🔗 customer_id [FK]</div>
                          <div>🔗 san_con_id [FK]</div>
                          <div>ngay_dat [DATE]</div>
                          <div>gio_bat_dau, gio_ket_thuc [INT]</div>
                          <div>tong_tien, trang_thai</div>
                        </div>
                        <div className="text-[9px] font-bold text-[#10B981] mb-1">Phương thức (CRUD / Nghiệp vụ):</div>
                        <div className="font-mono text-[9px] text-slate-500 grid grid-cols-2 gap-1 leading-tight">
                          <div>+taoYeuCauDat(customer, court...)</div>
                          <div>+kiemTraTrungLich(court, date...)</div>
                          <div>+xacNhanThanhToan(id, method)</div>
                          <div>+huyLichDat(id, lyDo)</div>
                          <div>+layLichDatCuaKhach(customer)</div>
                          <div>+layDoanhThuChuSan(ownerId)</div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. If any Sequence Diagram is selected */}
                {selectedDiagram !== 'class' && (
                  <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                    
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-display font-extrabold text-[#064E3B] uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} /> Máy mô phỏng luồng tuần tự tương tác
                        </h4>
                        <span className="text-[10px] bg-emerald-100 text-[#064E3B] px-2 py-0.5 rounded-full font-bold">
                          {activeStep + 1} / {seqSteps[selectedDiagram as keyof typeof seqSteps]?.length} bước
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Nhấn vào các bước hoặc sử dụng nút Tiến/Lùi để xem chuyển động dữ liệu trong hệ thống:
                      </p>
                    </div>

                    {/* Step Visualizer */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[140px] flex flex-col justify-between shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[10px] font-bold">
                            {activeStep + 1}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800">
                            {seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.title}
                          </h5>
                        </div>
                        
                        <div className="text-[10px] font-semibold text-[#10B981] mb-2 font-mono flex items-center gap-1 bg-[#10B981]/5 px-2 py-0.5 rounded self-start">
                          <span>Hướng truyền:</span>
                          <span>{seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.direction}</span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.desc}
                        </p>
                      </div>

                      {seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.api && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">API Endpoint / Giao thức</span>
                            <code className="text-[10px] font-mono text-cyan-700 bg-cyan-50/50 px-1.5 py-0.5 rounded block truncate" title={seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.api}>
                              {seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.api}
                            </code>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Câu lệnh SQL / Mã thực thi</span>
                            <code className="text-[10px] font-mono text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded block truncate font-bold" title={seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.sql}>
                              {seqSteps[selectedDiagram as keyof typeof seqSteps]?.[activeStep]?.sql}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step Navigator bullets */}
                    <div className="flex justify-center gap-1.5">
                      {seqSteps[selectedDiagram as keyof typeof seqSteps]?.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveStep(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                            activeStep === index ? 'bg-[#10B981] w-6' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                        disabled={activeStep === 0}
                        className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors text-xs font-bold cursor-pointer"
                      >
                        ← Bước trước
                      </button>
                      <button
                        onClick={() => setActiveStep(prev => Math.min((seqSteps[selectedDiagram as keyof typeof seqSteps]?.length || 1) - 1, prev + 1))}
                        disabled={activeStep === (seqSteps[selectedDiagram as keyof typeof seqSteps]?.length || 1) - 1}
                        className="flex-1 py-2 rounded-xl bg-[#10B981] hover:bg-[#064E3B] text-white disabled:opacity-50 transition-colors text-xs font-bold cursor-pointer"
                      >
                        Bước kế tiếp →
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FAQ */}
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
