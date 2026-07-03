import fs from "fs";
import path from "path";
import sql from "mssql";

const DB_FILE = path.join(process.cwd(), "db_store.json");

// Define interface for data elements to match existing JSON database structures
export interface User {
  id: string;
  username: string;
  password?: string; // stored as password_hash in SQL
  fullName: string;
  phone: string;
  role: "customer" | "owner" | "admin";
  createdAt: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Sport {
  id: string;
  name: string;
  iconName: string;
}

export interface CourtCluster {
  id: string;
  ownerId: string;
  name: string;
  districtId: string;
  address: string;
  imageUrl: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Court {
  id: string;
  clusterId: string;
  name: string;
  sportId: string;
  basePrice: number;
}

export interface PricingRule {
  id: string;
  clusterId: string;
  startHour: number;
  endHour: number;
  priceMultiplier: number;
}

export interface Booking {
  id: string;
  customerId: string;
  courtId: string;
  bookingDate: string;
  startHour: number;
  endHour: number;
  totalPrice: number;
  status: "pending_payment" | "paid" | "checked_in" | "cancelled";
  paymentMethod?: string;
  createdAt: string;
}

class Database {
  private isSqlEnabled: boolean = false;
  private pool: sql.ConnectionPool | null = null;

  constructor() {
    this.isSqlEnabled = process.env.DB_ENABLED === "true";
  }

  // Helper to load fallback JSON db
  private loadJsonDB() {
    if (!fs.existsSync(DB_FILE)) {
      // Seed data if not present
      const seedData = {
        users: [
          { id: "cust-1", username: "khachhang", password: "123", fullName: "Nguyễn Văn Hùng", phone: "0912345678", role: "customer", createdAt: new Date("2026-06-15").toISOString() },
          { id: "cust-2", username: "player_hn", password: "123", fullName: "Trần Minh Đức", phone: "0987654321", role: "customer", createdAt: new Date("2026-06-20").toISOString() },
          { id: "own-1", username: "chusan1", password: "123", fullName: "Lê Thị Thảo", phone: "0904445555", role: "owner", createdAt: new Date("2026-06-10").toISOString() },
          { id: "own-2", username: "chusan2", password: "123", fullName: "Phạm Quốc Tuấn", phone: "0933332222", role: "owner", createdAt: new Date("2026-06-12").toISOString() },
          { id: "adm-1", username: "admin", password: "123", fullName: "Quản Trị Viên", phone: "0999999999", role: "admin", createdAt: new Date("2026-06-01").toISOString() }
        ],
        districts: [
          { id: "d-1", name: "Cầu Giấy" },
          { id: "d-2", name: "Đống Đa" },
          { id: "d-3", name: "Ba Đình" },
          { id: "d-4", name: "Thanh Xuân" },
          { id: "d-5", name: "Nam Từ Liêm" },
          { id: "d-6", name: "Bắc Từ Liêm" },
          { id: "d-7", name: "Hai Bà Trưng" },
          { id: "d-8", name: "Hoàn Kiếm" },
          { id: "d-9", name: "Tây Hồ" },
          { id: "d-10", name: "Hà Đông" }
        ],
        sports: [
          { id: "s-1", name: "Bóng đá", iconName: "Flame" },
          { id: "s-2", name: "Cầu lông", iconName: "Activity" },
          { id: "s-3", name: "Pickleball", iconName: "Sparkles" },
          { id: "s-4", name: "Tennis", iconName: "Target" }
        ],
        court_clusters: [
          {
            id: "cc-1",
            ownerId: "own-1",
            name: "Sân Bóng Đại học Y Hà Nội",
            districtId: "d-2",
            address: "Số 1 Tôn Thất Tùng, Trung Tự, Đống Đa, Hà Nội",
            imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
            description: "Mặt cỏ nhân tạo tiêu chuẩn FIFA, đèn chiếu sáng cao áp hiện đại phục vụ các khung giờ tối, có khán đài và khu gửi xe rộng rãi.",
            status: "approved",
            createdAt: new Date("2026-06-11").toISOString()
          },
          {
            id: "cc-2",
            ownerId: "own-1",
            name: "Cụm Sân Cầu Lông Cầu Giấy",
            districtId: "d-1",
            address: "35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội",
            imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
            description: "Hệ thống 8 sân cầu lông thảm PVC chống trơn trượt tiêu chuẩn thi đấu, trần cao thoáng đãng, hệ thống ánh sáng chống lóa mắt.",
            status: "approved",
            createdAt: new Date("2026-06-12").toISOString()
          },
          {
            id: "cc-3",
            ownerId: "own-2",
            name: "Pickleball Club Mỹ Đình",
            districtId: "d-5",
            address: "Khu liên hợp thể thao Mỹ Đình, Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
            imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
            description: "Cụm sân Pickleball mới 100% ngoài trời có mái che, môn thể thao thịnh hành nhất hiện nay. Hỗ trợ cho thuê vợt và bóng đạt chuẩn.",
            status: "approved",
            createdAt: new Date("2026-06-14").toISOString()
          }
        ],
        courts: [
          { id: "c-1", clusterId: "cc-1", name: "Sân Bóng ĐH Y - Sân 7 Số 1", sportId: "s-1", basePrice: 300000 },
          { id: "c-2", clusterId: "cc-1", name: "Sân Bóng ĐH Y - Sân 7 Số 2", sportId: "s-1", basePrice: 300000 },
          { id: "c-3", clusterId: "cc-2", name: "Sân Cầu Lông CG - Thảm 1", sportId: "s-2", basePrice: 80000 },
          { id: "c-4", clusterId: "cc-2", name: "Sân Cầu Lông CG - Thảm 2", sportId: "s-2", basePrice: 80000 },
          { id: "c-6", clusterId: "cc-3", name: "Sân Pickleball MĐ - Sân A", sportId: "s-3", basePrice: 150000 }
        ],
        pricing_rules: [
          { id: "pr-1", clusterId: "cc-1", startHour: 17, endHour: 21, priceMultiplier: 1.3 },
          { id: "pr-2", clusterId: "cc-2", startHour: 17, endHour: 21, priceMultiplier: 1.3 }
        ],
        bookings: [
          {
            id: "b-1",
            customerId: "cust-1",
            courtId: "c-1",
            bookingDate: "2026-07-01",
            startHour: 18,
            endHour: 20,
            totalPrice: 780000,
            status: "checked_in",
            paymentMethod: "momo",
            createdAt: new Date("2026-06-30T10:00:00Z").toISOString()
          }
        ]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), "utf-8");
      return seedData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }

  private saveJsonDB(data: any) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  // Connect to SQL Server & Sync tables if enabled
  public async initialize() {
    // Read DB_ENABLED here to ensure environment variables from dotenv are fully loaded
    this.isSqlEnabled = process.env.DB_ENABLED === "true";

    if (!this.isSqlEnabled) {
      console.log("Database fallback mode: Using JSON Store (db_store.json)");
      this.loadJsonDB(); // Ensure exists
      return;
    }

    try {
      let dbUser = process.env.DB_USER || "sa";
      let domain: string | undefined = undefined;

      // Automatically handle Windows Authentication Domain User format (e.g., DOMAIN\username)
      if (dbUser.includes("\\")) {
        const parts = dbUser.split("\\");
        domain = parts[0];
        dbUser = parts[1];
        console.log(`Parsed Windows Auth credentials: Domain = "${domain}", User = "${dbUser}"`);
      }

      const sqlConfig: sql.config = {
        user: dbUser,
        password: process.env.DB_PASSWORD || "", // empty password specified
        server: process.env.DB_SERVER || "localhost",
        database: process.env.DB_NAME || "sportzone_db",
        port: parseInt(process.env.DB_PORT || "1433"),
        domain: domain,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          connectTimeout: 5000
        }
      };

      console.log(`Connecting to SQL Server at ${sqlConfig.server}:${sqlConfig.port}, Database: ${sqlConfig.database}...`);
      this.pool = await sql.connect(sqlConfig);
      console.log("SQL Server connected successfully!");

      // Bootstrap and Seeding
      await this.bootstrapSchema();
    } catch (err: any) {
      console.error("SQL Server connection failed, falling back to JSON db store. Error:", err.message);
      this.isSqlEnabled = false;
      this.loadJsonDB();
    }
  }

  private async bootstrapSchema() {
    if (!this.pool) return;

    try {
      // 1. quan_huyen table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quan_huyen' AND xtype='U')
        CREATE TABLE quan_huyen (
            id VARCHAR(50) PRIMARY KEY,
            ten_quan NVARCHAR(100) NOT NULL UNIQUE
        );
      `);

      // 2. bo_mon table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bo_mon' AND xtype='U')
        CREATE TABLE bo_mon (
            id VARCHAR(50) PRIMARY KEY,
            ten_bo_mon NVARCHAR(50) NOT NULL UNIQUE,
            icon_name VARCHAR(50)
        );
      `);

      // 3. nguoi_dung table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='nguoi_dung' AND xtype='U')
        CREATE TABLE nguoi_dung (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            ho_ten NVARCHAR(150) NOT NULL,
            so_dien_thoai VARCHAR(15) NOT NULL,
            vai_tro VARCHAR(20) NOT NULL CHECK (vai_tro IN ('customer', 'owner', 'admin')),
            ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. cum_san table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cum_san' AND xtype='U')
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
      `);

      // 5. san_con table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='san_con' AND xtype='U')
        CREATE TABLE san_con (
            id VARCHAR(50) PRIMARY KEY,
            cum_san_id VARCHAR(50) NOT NULL,
            ten_san NVARCHAR(100) NOT NULL,
            bo_mon_id VARCHAR(50) NOT NULL,
            gia_co_ban DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
            FOREIGN KEY (bo_mon_id) REFERENCES bo_mon(id)
        );
      `);

      // 6. khung_gio_vang table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='khung_gio_vang' AND xtype='U')
        CREATE TABLE khung_gio_vang (
            id VARCHAR(50) PRIMARY KEY,
            cum_san_id VARCHAR(50) NOT NULL,
            gio_bat_dau INT NOT NULL CHECK (gio_bat_dau >= 0 AND gio_bat_dau <= 23),
            gio_ket_thuc INT NOT NULL CHECK (gio_ket_thuc >= 0 AND gio_ket_thuc <= 23),
            he_so_gia DECIMAL(3, 2) NOT NULL DEFAULT 1.3,
            FOREIGN KEY (cum_san_id) REFERENCES cum_san(id) ON DELETE CASCADE,
            CONSTRAINT check_khung_gio CHECK (gio_bat_dau < gio_ket_thuc)
        );
      `);

      // 7. lich_dat table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='lich_dat' AND xtype='U')
        CREATE TABLE lich_dat (
            id VARCHAR(50) PRIMARY KEY,
            customer_id VARCHAR(50) NOT NULL,
            san_con_id VARCHAR(50) NOT NULL,
            ngay_dat DATE NOT NULL,
            gio_bat_dau INT NOT NULL,
            gio_ket_thuc INT NOT NULL,
            tong_tien DECIMAL(12, 2) NOT NULL,
            trang_thai VARCHAR(30) NOT NULL DEFAULT 'pending_payment' 
                CHECK (trang_thai IN ('pending_payment', 'paid', 'checked_in', 'cancelled')),
            phuong_thuc_thanh_toan NVARCHAR(50),
            ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES nguoi_dung(id),
            FOREIGN KEY (san_con_id) REFERENCES san_con(id),
            CONSTRAINT check_gio_choi CHECK (gio_bat_dau < gio_ket_thuc)
        );
      `);

      // 8. Unique Index to prevent overbooking
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_prevent_overbooking' AND object_id=OBJECT_ID('lich_dat'))
        CREATE UNIQUE INDEX idx_prevent_overbooking ON lich_dat (san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc) 
        WHERE trang_thai != 'cancelled';
      `);

      // Seed core static tables (quan_huyen, bo_mon, and admin user) if empty
      const districtCheck = await this.pool.request().query("SELECT COUNT(*) as count FROM quan_huyen");
      if (districtCheck.recordset[0].count === 0) {
        console.log("Seeding static data to SQL Server...");
        
        // Districts
        const districtsJson = this.loadJsonDB().districts;
        for (const d of districtsJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), d.id)
            .input("name", sql.NVarChar(100), d.name)
            .query("INSERT INTO quan_huyen (id, ten_quan) VALUES (@id, @name)");
        }

        // Sports
        const sportsJson = this.loadJsonDB().sports;
        for (const s of sportsJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), s.id)
            .input("name", sql.NVarChar(50), s.name)
            .input("iconName", sql.VarChar(50), s.iconName)
            .query("INSERT INTO bo_mon (id, ten_bo_mon, icon_name) VALUES (@id, @name, @iconName)");
        }

        // Default Users
        const usersJson = this.loadJsonDB().users;
        for (const u of usersJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), u.id)
            .input("username", sql.VarChar(100), u.username)
            .input("password_hash", sql.VarChar(255), u.password)
            .input("ho_ten", sql.NVarChar(150), u.fullName)
            .input("so_dien_thoai", sql.VarChar(15), u.phone)
            .input("vai_tro", sql.VarChar(20), u.role)
            .query("INSERT INTO nguoi_dung (id, username, password_hash, ho_ten, so_dien_thoai, vai_tro) VALUES (@id, @username, @password_hash, @ho_ten, @so_dien_thoai, @vai_tro)");
        }

        // Default Clusters
        const clustersJson = this.loadJsonDB().court_clusters;
        for (const c of clustersJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), c.id)
            .input("owner_id", sql.VarChar(50), c.ownerId)
            .input("ten_cum_san", sql.NVarChar(150), c.name)
            .input("quan_huyen_id", sql.VarChar(50), c.districtId)
            .input("dia_chi_chi_tiet", sql.NVarChar(255), c.address)
            .input("image_url", sql.VarChar(255), c.imageUrl)
            .input("mo_ta", sql.NVarChar(sql.MAX), c.description)
            .input("trang_thai", sql.VarChar(20), c.status)
            .query("INSERT INTO cum_san (id, owner_id, ten_cum_san, quan_huyen_id, dia_chi_chi_tiet, image_url, mo_ta, trang_thai) VALUES (@id, @owner_id, @ten_cum_san, @quan_huyen_id, @dia_chi_chi_tiet, @image_url, @mo_ta, @trang_thai)");
        }

        // Default Courts
        const courtsJson = this.loadJsonDB().courts;
        for (const crt of courtsJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), crt.id)
            .input("cum_san_id", sql.VarChar(50), crt.clusterId)
            .input("ten_san", sql.NVarChar(100), crt.name)
            .input("bo_mon_id", sql.VarChar(50), crt.sportId)
            .input("gia_co_ban", sql.Decimal(10, 2), crt.basePrice)
            .query("INSERT INTO san_con (id, cum_san_id, ten_san, bo_mon_id, gia_co_ban) VALUES (@id, @cum_san_id, @ten_san, @bo_mon_id, @gia_co_ban)");
        }

        // Default Pricing Rules
        const rulesJson = this.loadJsonDB().pricing_rules;
        for (const r of rulesJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), r.id)
            .input("cum_san_id", sql.VarChar(50), r.clusterId)
            .input("gio_bat_dau", sql.Int, r.startHour)
            .input("gio_ket_thuc", sql.Int, r.endHour)
            .input("he_so_gia", sql.Decimal(3, 2), r.priceMultiplier)
            .query("INSERT INTO khung_gio_vang (id, cum_san_id, gio_bat_dau, gio_ket_thuc, he_so_gia) VALUES (@id, @cum_san_id, @gio_bat_dau, @gio_ket_thuc, @he_so_gia)");
        }

        // Default Bookings
        const bookingsJson = this.loadJsonDB().bookings;
        for (const b of bookingsJson) {
          await this.pool.request()
            .input("id", sql.VarChar(50), b.id)
            .input("customer_id", sql.VarChar(50), b.customerId)
            .input("san_con_id", sql.VarChar(50), b.courtId)
            .input("ngay_dat", sql.Date, b.bookingDate)
            .input("gio_bat_dau", sql.Int, b.startHour)
            .input("gio_ket_thuc", sql.Int, b.endHour)
            .input("tong_tien", sql.Decimal(12, 2), b.totalPrice)
            .input("trang_thai", sql.VarChar(30), b.status)
            .input("phuong_thuc_thanh_toan", sql.NVarChar(50), b.paymentMethod)
            .query("INSERT INTO lich_dat (id, customer_id, san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc, tong_tien, trang_thai, phuong_thuc_thanh_toan) VALUES (@id, @customer_id, @san_con_id, @ngay_dat, @gio_bat_dau, @gio_ket_thuc, @tong_tien, @trang_thai, @phuong_thuc_thanh_toan)");
        }

        console.log("SQL Server seed completed successfully!");
      }

    } catch (err: any) {
      console.error("Error bootstrapping SQL Server schema:", err.message);
    }
  }

  // --- Core CRUD operations with automated toggle ---

  // 1. Districts
  public async getDistricts(): Promise<District[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query("SELECT id, ten_quan as name FROM quan_huyen");
      return res.recordset;
    }
    return this.loadJsonDB().districts;
  }

  // 2. Sports
  public async getSports(): Promise<Sport[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query("SELECT id, ten_bo_mon as name, icon_name as iconName FROM bo_mon");
      return res.recordset;
    }
    return this.loadJsonDB().sports;
  }

  // 3. Users Auth
  public async getUsers(): Promise<User[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query(`
        SELECT id, username, password_hash as password, ho_ten as fullName, so_dien_thoai as phone, vai_tro as role, ngay_tao as createdAt 
        FROM nguoi_dung
      `);
      return res.recordset.map(u => ({
        ...u,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
      }));
    }
    return this.loadJsonDB().users;
  }

  public async addUser(user: User): Promise<User> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), user.id)
        .input("username", sql.VarChar(100), user.username)
        .input("password_hash", sql.VarChar(255), user.password || "123")
        .input("ho_ten", sql.NVarChar(150), user.fullName)
        .input("so_dien_thoai", sql.VarChar(15), user.phone)
        .input("vai_tro", sql.VarChar(20), user.role)
        .query(`
          INSERT INTO nguoi_dung (id, username, password_hash, ho_ten, so_dien_thoai, vai_tro) 
          VALUES (@id, @username, @password_hash, @ho_ten, @so_dien_thoai, @vai_tro)
        `);
      return user;
    }

    const db = this.loadJsonDB();
    db.users.push(user);
    this.saveJsonDB(db);
    return user;
  }

  // 4. Clusters
  public async getClusters(): Promise<CourtCluster[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query(`
        SELECT id, owner_id as ownerId, ten_cum_san as name, quan_huyen_id as districtId, 
               dia_chi_chi_tiet as address, image_url as imageUrl, mo_ta as description, 
               trang_thai as status, ngay_tao as createdAt 
        FROM cum_san
      `);
      return res.recordset.map(c => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
      }));
    }
    return this.loadJsonDB().court_clusters;
  }

  public async addCluster(cluster: CourtCluster): Promise<CourtCluster> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), cluster.id)
        .input("owner_id", sql.VarChar(50), cluster.ownerId)
        .input("ten_cum_san", sql.NVarChar(150), cluster.name)
        .input("quan_huyen_id", sql.VarChar(50), cluster.districtId)
        .input("dia_chi_chi_tiet", sql.NVarChar(255), cluster.address)
        .input("image_url", sql.VarChar(255), cluster.imageUrl)
        .input("mo_ta", sql.NVarChar(sql.MAX), cluster.description)
        .input("trang_thai", sql.VarChar(20), cluster.status)
        .query(`
          INSERT INTO cum_san (id, owner_id, ten_cum_san, quan_huyen_id, dia_chi_chi_tiet, image_url, mo_ta, trang_thai) 
          VALUES (@id, @owner_id, @ten_cum_san, @quan_huyen_id, @dia_chi_chi_tiet, @image_url, @mo_ta, @trang_thai)
        `);
      return cluster;
    }

    const db = this.loadJsonDB();
    db.court_clusters.push(cluster);
    this.saveJsonDB(db);
    return cluster;
  }

  public async updateClusterStatus(id: string, status: string): Promise<void> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), id)
        .input("status", sql.VarChar(20), status)
        .query("UPDATE cum_san SET trang_thai = @status WHERE id = @id");
      return;
    }

    const db = this.loadJsonDB();
    const idx = db.court_clusters.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      db.court_clusters[idx].status = status;
      this.saveJsonDB(db);
    }
  }

  // 5. Courts (Sân con)
  public async getCourts(): Promise<Court[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query(`
        SELECT id, cum_san_id as clusterId, ten_san as name, bo_mon_id as sportId, gia_co_ban as basePrice 
        FROM san_con
      `);
      return res.recordset.map(crt => ({
        ...crt,
        basePrice: Number(crt.basePrice)
      }));
    }
    return this.loadJsonDB().courts;
  }

  public async addCourt(court: Court): Promise<Court> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), court.id)
        .input("cum_san_id", sql.VarChar(50), court.clusterId)
        .input("ten_san", sql.NVarChar(100), court.name)
        .input("bo_mon_id", sql.VarChar(50), court.sportId)
        .input("gia_co_ban", sql.Decimal(10, 2), court.basePrice)
        .query(`
          INSERT INTO san_con (id, cum_san_id, ten_san, bo_mon_id, gia_co_ban) 
          VALUES (@id, @cum_san_id, @ten_san, @bo_mon_id, @gia_co_ban)
        `);
      return court;
    }

    const db = this.loadJsonDB();
    db.courts.push(court);
    this.saveJsonDB(db);
    return court;
  }

  // 6. Pricing Rules (Khung giờ vàng)
  public async getPricingRules(): Promise<PricingRule[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query(`
        SELECT id, cum_san_id as clusterId, gio_bat_dau as startHour, gio_ket_thuc as endHour, he_so_gia as priceMultiplier 
        FROM khung_gio_vang
      `);
      return res.recordset.map(r => ({
        ...r,
        priceMultiplier: Number(r.priceMultiplier)
      }));
    }
    return this.loadJsonDB().pricing_rules;
  }

  public async addPricingRule(rule: PricingRule): Promise<PricingRule> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), rule.id)
        .input("cum_san_id", sql.VarChar(50), rule.clusterId)
        .input("gio_bat_dau", sql.Int, rule.startHour)
        .input("gio_ket_thuc", sql.Int, rule.endHour)
        .input("he_so_gia", sql.Decimal(3, 2), rule.priceMultiplier)
        .query(`
          INSERT INTO khung_gio_vang (id, cum_san_id, gio_bat_dau, gio_ket_thuc, he_so_gia) 
          VALUES (@id, @cum_san_id, @gio_bat_dau, @gio_ket_thuc, @he_so_gia)
        `);
      return rule;
    }

    const db = this.loadJsonDB();
    db.pricing_rules.push(rule);
    this.saveJsonDB(db);
    return rule;
  }

  // 7. Bookings
  public async getBookings(): Promise<Booking[]> {
    if (this.isSqlEnabled && this.pool) {
      const res = await this.pool.request().query(`
        SELECT id, customer_id as customerId, san_con_id as courtId, ngay_dat as bookingDate, 
               gio_bat_dau as startHour, gio_ket_thuc as endHour, tong_tien as totalPrice, 
               trang_thai as status, phuong_thuc_thanh_toan as paymentMethod, ngay_tao as createdAt 
        FROM lich_dat
      `);
      return res.recordset.map(b => {
        // Date formatting safe for SQL Server output (YYYY-MM-DD)
        let formattedDate = "";
        try {
          formattedDate = b.bookingDate ? new Date(b.bookingDate).toISOString().split("T")[0] : "";
        } catch (e) {
          formattedDate = String(b.bookingDate);
        }

        return {
          ...b,
          bookingDate: formattedDate,
          totalPrice: Number(b.totalPrice),
          createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()
        };
      });
    }
    return this.loadJsonDB().bookings;
  }

  public async addBooking(booking: Booking): Promise<Booking> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), booking.id)
        .input("customer_id", sql.VarChar(50), booking.customerId)
        .input("san_con_id", sql.VarChar(50), booking.courtId)
        .input("ngay_dat", sql.Date, booking.bookingDate)
        .input("gio_bat_dau", sql.Int, booking.startHour)
        .input("gio_ket_thuc", sql.Int, booking.endHour)
        .input("tong_tien", sql.Decimal(12, 2), booking.totalPrice)
        .input("trang_thai", sql.VarChar(30), booking.status)
        .input("phuong_thuc_thanh_toan", sql.NVarChar(50), booking.paymentMethod || null)
        .query(`
          INSERT INTO lich_dat (id, customer_id, san_con_id, ngay_dat, gio_bat_dau, gio_ket_thuc, tong_tien, trang_thai, phuong_thuc_thanh_toan) 
          VALUES (@id, @customer_id, @san_con_id, @ngay_dat, @gio_bat_dau, @gio_ket_thuc, @tong_tien, @trang_thai, @phuong_thuc_thanh_toan)
        `);
      return booking;
    }

    const db = this.loadJsonDB();
    db.bookings.push(booking);
    this.saveJsonDB(db);
    return booking;
  }

  public async updateBookingStatus(id: string, status: string): Promise<void> {
    if (this.isSqlEnabled && this.pool) {
      await this.pool.request()
        .input("id", sql.VarChar(50), id)
        .input("status", sql.VarChar(30), status)
        .query("UPDATE lich_dat SET trang_thai = @status WHERE id = @id");
      return;
    }

    const db = this.loadJsonDB();
    const idx = db.bookings.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      db.bookings[idx].status = status;
      this.saveJsonDB(db);
    }
  }
}

export const db = new Database();
