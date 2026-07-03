export const TECHNICAL_DOC = `
# TÀI LIỆU KỸ THUẬT & NGHIỆP VỤ: SPORTZONE HÀ NỘI

> **Đơn vị môn học:** Quản lý dự án CNTT  
> **Dự án:** Hệ thống đặt sân thể thao trực tuyến SportZone Hà Nội  
> **Kiến trúc đề xuất:** Full-Stack (React 19 + Express NodeJS + Relational Schema)

---

## 1. TỔNG QUAN DỰ ÁN & TIẾN ĐỘ WBS (WORK BREAKDOWN STRUCTURE)

Dự án **SportZone Hà Nội** được xây dựng nhằm giải quyết bài toán tối ưu hóa công suất khai thác sân thể thao tại 10+ quận/huyện sầm uất nhất Thủ đô (Cầu Giấy, Đống Đa, Ba Đình, v.v.), giảm thời gian đặt lịch của khách hàng từ vài tiếng (gọi điện, thương lượng) xuống còn **30 giây**.

### Phân rã công việc WBS & Kế hoạch Thực hiện:
1. **Khởi động dự án (Initiation)**: Xác định phạm vi địa lý (chỉ Hà Nội), lựa chọn 4 bộ môn cốt lõi (Bóng đá, Cầu lông, Pickleball, Tennis).
2. **Thiết kế hệ thống (Design & Architecture)**:
   - Chuẩn hóa Database 3NF phòng ngừa lỗi Overbooking.
   - Thiết kế UI/UX thích ứng cao trên thiết bị di động.
3. **Phát triển sản phẩm (Implementation)**:
   - **Backend**: API quản lý sân, xác thực người dùng, và bộ máy phân bổ khung giờ thời gian thực.
   - **Frontend**: Màn hình Tìm kiếm lọc theo Quận, đặt lịch nhanh theo giờ vàng, bảng điều khiển doanh thu cho chủ sân.
   - **AI Integration**: Tích hợp trợ lý ảo thông minh Gemini giúp người chơi tìm kiếm sân theo mô tả tự nhiên.
4. **Kiểm thử & Đóng gói (Testing & Deployment)**: Kiểm thử tải trùng lặp lịch, đóng gói Docker chạy trên Google Cloud Run.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (3NF SQL SCHEMA)

Hệ thống sử dụng cơ sở dữ liệu quan hệ với ràng buộc khóa ngoại chặt chẽ, tối ưu hóa câu lệnh truy vấn và thiết lập khóa liên hợp (Composite Key) để bảo vệ toàn vẹn dữ liệu. 

> ⚠️ **LƯU Ý QUAN TRỌNG CHO SQL SERVER:** Trong SQL Server, kiểu dữ liệu \`TIMESTAMP\` được hiểu là \`ROWVERSION\` (một số nhị phân tự động tăng dùng để tracking phiên bản dòng, không phải ngày tháng) và không thể gán giá trị mặc định \`DEFAULT CURRENT_TIMESTAMP\`. Để lưu trữ ngày tháng trên SQL Server, bắt buộc sử dụng kiểu dữ liệu \`DATETIME\` hoặc \`DATETIME2\`.

Dưới đây là 2 phiên bản mã nguồn SQL chuẩn hóa 3NF:

### Phiên bản 1: Microsoft SQL Server (T-SQL) - Chạy trên máy cá nhân
\`\`\`sql
-- 1. Bảng danh mục Quận/Huyện Hà Nội
CREATE TABLE quan_huyen (
    id VARCHAR(50) PRIMARY KEY,
    ten_quan NVARCHAR(100) NOT NULL UNIQUE
);

-- 2. Bảng danh mục Bộ môn thể thao
CREATE TABLE bo_mon (
    id VARCHAR(50) PRIMARY KEY,
    ten_bo_mon NVARCHAR(50) NOT NULL UNIQUE,
    icon_name VARCHAR(50)
);

-- 3. Bảng Người dùng (Khách hàng, Chủ sân, Admin)
CREATE TABLE nguoi_dung (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ho_ten NVARCHAR(150) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL CHECK (vai_tro IN ('customer', 'owner', 'admin')),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP -- Dùng DATETIME thay vì TIMESTAMP trên SQL Server
);

-- 4. Bảng Cụm sân thể thao (Do đối tác chủ sân quản lý)
CREATE TABLE cum_san (
    id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL,
    ten_cum_san NVARCHAR(150) NOT NULL,
    quan_huyen_id VARCHAR(50) NOT NULL,
    dia_chi_chi_tiet NVARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    mo_ta NVARCHAR(MAX),
    trang_thai VARCHAR(20) DEFAULT 'pending' CHECK (trang_thai IN ('pending', 'approved', 'rejected')),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (quan_huyen_id) REFERENCES quan_huyen(id)
);

-- 5. Bảng Sân con (Ví dụ: Sân 7 số 1, Sân cầu lông thảm 1)
CREATE TABLE san_con (
    id VARCHAR(50) PRIMARY KEY,
    cum_san_id VARCHAR(50) NOT NULL,
    ten_san NVARCHAR(100) NOT NULL,
    bo_mon_id VARCHAR(50) NOT NULL,
    gia_co_ban DECIMAL(10, 2) NOT NULL, -- Giá cơ bản cho 1 giờ chơi
    FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
    FOREIGN KEY (bo_mon_id) REFERENCES bo_mon(id)
);

-- 6. Bảng cấu hình khung giờ vàng (Pricing Rules)
CREATE TABLE khung_gio_vang (
    id VARCHAR(50) PRIMARY KEY,
    cum_san_id VARCHAR(50) NOT NULL,
    gio_bat_dau INT NOT NULL CHECK (gio_bat_dau >= 0 AND gio_bat_dau <= 23),
    gio_ket_thuc INT NOT NULL CHECK (gio_ket_thuc >= 0 AND gio_ket_thuc <= 23),
    he_so_gia DECIMAL(3, 2) NOT NULL DEFAULT 1.3, -- Ví dụ: 1.3 tăng 30% giá giờ vàng
    FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
    CONSTRAINT check_khung_gio CHECK (gio_bat_dau < gio_ket_thuc)
);

-- 7. Bảng Lịch đặt sân (Booking)
CREATE TABLE lich_dat (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    san_con_id VARCHAR(50) NOT NULL,
    ngay_dat DATE NOT NULL, -- Ngày chơi thể thao (YYYY-MM-DD)
    gio_bat_dau INT NOT NULL, -- Giờ bắt đầu (Ví dụ: 18)
    gio_ket_thuc INT NOT NULL, -- Giờ kết thúc (Ví dụ: 20)
    tong_tien DECIMAL(12, 2) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'pending_payment' 
        CHECK (trang_thai IN ('pending_payment', 'paid', 'checked_in', 'cancelled')),
    phuong_thuc_thanh_toan NVARCHAR(50),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES nguoi_dung(id),
    FOREIGN KEY (san_con_id) REFERENCES san_con(id),
    CONSTRAINT check_gio_choi CHECK (gio_bat_dau < gio_ket_thuc)
);

-- CHỈ MỤC (INDEX) TỐI ƯU HÓA TRUY VẤN VÀ NGĂN NGỪA OVERBOOKING TRÊN DATABASE SQL SERVER
CREATE UNIQUE INDEX idx_prevent_overbooking ON lich_dat (san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc) 
WHERE trang_thai != 'cancelled';
\`\`\`

### Phiên bản 2: PostgreSQL / MySQL / Oracle (Chạy trên Cloud)
\`\`\`sql
-- 1. Bảng danh mục Quận/Huyện Hà Nội
CREATE TABLE quan_huyen (
    id VARCHAR(50) PRIMARY KEY,
    ten_quan VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Bảng danh mục Bộ môn thể thao
CREATE TABLE bo_mon (
    id VARCHAR(50) PRIMARY KEY,
    ten_bo_mon VARCHAR(50) NOT NULL UNIQUE,
    icon_name VARCHAR(50)
);

-- 3. Bảng Người dùng (Khách hàng, Chủ sân, Admin)
CREATE TABLE nguoi_dung (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(150) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL CHECK (vai_tro IN ('customer', 'owner', 'admin')),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Cụm sân thể thao (Do đối tác chủ sân quản lý)
CREATE TABLE cum_san (
    id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) NOT NULL,
    ten_cum_san VARCHAR(150) NOT NULL,
    quan_huyen_id VARCHAR(50) NOT NULL,
    dia_chi_chi_tiet VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    mo_ta TEXT,
    trang_thai VARCHAR(20) DEFAULT 'pending' CHECK (trang_thai IN ('pending', 'approved', 'rejected')),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (quan_huyen_id) REFERENCES quan_huyen(id)
);

-- 5. Bảng Sân con (Ví dụ: Sân 7 số 1, Sân cầu lông thảm 1)
CREATE TABLE san_con (
    id VARCHAR(50) PRIMARY KEY,
    cum_san_id VARCHAR(50) NOT NULL,
    ten_san VARCHAR(100) NOT NULL,
    bo_mon_id VARCHAR(50) NOT NULL,
    gia_co_ban DECIMAL(10, 2) NOT NULL, -- Giá cơ bản cho 1 giờ chơi
    FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
    FOREIGN KEY (bo_mon_id) REFERENCES bo_mon(id)
);

-- 6. Bảng cấu hình khung giờ vàng (Pricing Rules)
CREATE TABLE khung_gio_vang (
    id VARCHAR(50) PRIMARY KEY,
    cum_san_id VARCHAR(50) NOT NULL,
    gio_bat_dau INT NOT NULL CHECK (gio_bat_dau >= 0 AND gio_bat_dau <= 23),
    gio_ket_thuc INT NOT NULL CHECK (gio_ket_thuc >= 0 AND gio_ket_thuc <= 23),
    he_so_gia DECIMAL(3, 2) NOT NULL DEFAULT 1.3, -- Ví dụ: 1.3 tăng 30% giá giờ vàng
    FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
    CONSTRAINT check_khung_gio CHECK (gio_bat_dau < gio_ket_thuc)
);

-- 7. Bảng Lịch đặt sân (Booking)
CREATE TABLE lich_dat (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    san_con_id VARCHAR(50) NOT NULL,
    ngay_dat DATE NOT NULL, -- Ngày chơi thể thao (YYYY-MM-DD)
    gio_bat_dau INT NOT NULL, -- Giờ bắt đầu (Ví dụ: 18)
    gio_ket_thuc INT NOT NULL, -- Giờ kết thúc (Ví dụ: 20)
    tong_tien DECIMAL(12, 2) NOT NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'pending_payment' 
        CHECK (trang_thai IN ('pending_payment', 'paid', 'checked_in', 'cancelled')),
    phuong_thuc_thanh_toan VARCHAR(50),
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES nguoi_dung(id),
    FOREIGN KEY (san_con_id) REFERENCES san_con(id),
    CONSTRAINT check_gio_choi CHECK (gio_bat_dau < gio_ket_thuc)
);

-- CHỈ MỤC (INDEX) TỐI ƯU HÓA TRUY VẤN VÀ NGĂN NGỪA OVERBOOKING TRÊN DATABASE
CREATE UNIQUE INDEX idx_prevent_overbooking ON lich_dat (san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc) 
WHERE trang_thai != 'cancelled';
\`\`\`

---

## 3. CƠ CHẾ CHỐNG TRÙNG LỊCH (ANTI-OVERBOOKING SYSTEM)

Một trong những rủi ro lớn nhất của hệ thống quản lý đặt sân là **Overbooking** (hai khách hàng đặt trùng một sân con cùng một thời điểm). Để giải quyết triệt để, SportZone Hà Nội áp dụng 2 lớp bảo vệ:

### Lớp 1: Khóa bi quan (Pessimistic Locking) hoặc Kiểm tra giao dịch ở Backend
Trước khi lưu bản ghi lịch đặt mới vào bảng \`lich_dat\`, hệ thống thực hiện một truy vấn kiểm tra trùng lặp với logic toán học chặt chẽ.

**Công thức xác định trùng lặp hai khoảng thời gian $[S_1, E_1]$ và $[S_2, E_2]$:**
$$\\text{Trùng lịch} \\iff S_1 < E_2 \\quad \\text{VÀ} \\quad S_2 < E_1$$

**Truy vấn SQL Kiểm tra (Nếu kết quả > 0 thì từ chối đặt lịch):**
\`\`\`sql
SELECT COUNT(*) FROM lich_dat
WHERE san_con_id = :courtId
  AND ngay_dat = :bookingDate
  AND trang_thai != 'cancelled'
  AND :startHour < gio_ket_thuc 
  AND gio_bat_dau < :endHour;
\`\`\`

### Lớp 2: Ràng buộc nguyên tử (Atomic Check) trong Server Node.js
Mã nguồn xử lý đặt lịch của hệ thống được bọc trong hàm đồng bộ hóa trạng thái:
\`\`\`typescript
const overlaps = db.bookings.filter((b) => {
  return (
    b.courtId === courtId &&
    b.bookingDate === bookingDate &&
    b.status !== 'cancelled' &&
    startHour < b.endHour &&
    b.startHour < endHour
  );
});

if (overlaps.length > 0) {
  throw new Error("Khung giờ này vừa có người đặt!");
}
\`\`\`

---

## 4. HƯỚNG DẪN GIẢI TRÌNH BẢO VỆ BÀI TẬP LỚN (JURY QA GUIDE)

Khi đứng trước Hội đồng chấm Quản lý dự án CNTT, sinh viên cần giải trình được các khía cạnh quản trị và kỹ thuật sau:

### Câu hỏi 1: Làm thế nào dự án quản lý được tiến độ và phạm vi?
* **Trả lời:** Chúng em kiểm soát phạm vi chặt chẽ (Phạm vi địa lý chỉ giới hạn trong Hà Nội với 10 quận huyện trọng điểm và 4 bộ môn phổ biến nhất). Chúng em chia tiến độ thành các mốc rõ rệt (Milestones) bằng phương pháp Agile/Scrum, theo dõi tiến trình qua biểu đồ Burndown và bảng Kanban.

### Câu hỏi 2: Giải pháp kỹ thuật nào ngăn chặn việc thanh toán ảo hoặc đặt sân khống?
* **Trả lời:** Hệ thống có trạng thái đặt lịch rõ ràng: \`pending_payment\` (Chờ thanh toán). Sau khi khách hàng chuyển khoản hoặc quét QR giả lập qua MoMo/VNPay thành công, trạng thái mới chuyển sang \`paid\` (Đã thanh toán). Chủ sân có quyền hủy lịch nếu quá hạn thanh toán mà chưa nhận được tiền.

### Câu hỏi 3: Việc thiết lập giá khác nhau theo giờ (pricing rule) mang lại giá trị kinh tế nào?
* **Trả lời:** Đây là chiến lược **Dynamic Pricing (Định giá động)** áp dụng cho giờ vàng (17h - 21h). Giúp chủ sân tối đa hóa doanh thu khi nhu cầu cao và khuyến khích người chơi đặt giờ thường để nhận giá rẻ hơn, từ đó điều hòa tải trọng cho cụm sân.
`;
