import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./src/db";
import { getDefaultSportImage } from "./src/utils/imageHelper";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

// Safe ESM & CJS path resolution helpers
const resolvedFilename = (() => {
  try {
    return fileURLToPath(import.meta.url);
  } catch (e) {
    return typeof __filename !== "undefined" ? __filename : "";
  }
})();

const resolvedDirname = resolvedFilename 
  ? path.dirname(resolvedFilename) 
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());

const PORT = 3000;

// Helper to get current Hanoi time (UTC+7)
function getHanoiTime() {
  const hanoiMs = Date.now() + 7 * 3600000;
  const hanoiDate = new Date(hanoiMs);
  const yyyy = hanoiDate.getUTCFullYear();
  const mm = String(hanoiDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(hanoiDate.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const hour = hanoiDate.getUTCHours();
  const minutes = hanoiDate.getUTCMinutes();
  return { dateStr, hour, minutes };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Configure secure CORS (Cross-Origin Resource Sharing)
  app.use(cors((req: any, callback: any) => {
    const origin = req.header('Origin');
    const host = req.header('Host') || req.header('host');
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
      : [];

    let isAllowed = false;

    // 1. In development or if there is no origin (e.g. self-fetch, curl), allow it
    if (!origin || process.env.NODE_ENV !== "production") {
      isAllowed = true;
    } else {
      // 2. Check same-origin dynamically in production (frontend and backend on the same host)
      const isSameOrigin = host && (
        origin === `http://${host}` || 
        origin === `https://${host}` ||
        origin.replace(/^https?:\/\//, '') === host
      );

      if (isSameOrigin) {
        isAllowed = true;
      } else {
        // 3. Check if origin is in ALLOWED_ORIGINS
        isAllowed = allowedOrigins.some(allowedOpt => {
          if (!allowedOpt) return false;
          if (allowedOpt.includes("*")) {
            const regex = new RegExp("^" + allowedOpt.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
            return regex.test(origin);
          }
          return allowedOpt === origin;
        });
      }
    }

    if (isAllowed) {
      callback(null, {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
        maxAge: 86400 // Cache preflight response for 24 hours
      });
    } else {
      console.warn(`CORS blocked request from origin: ${origin} (Host: ${host})`);
      callback(new Error("Không được phép truy cập theo chính sách CORS của SportZone!"));
    }
  }));

  // Initialize DB driver (Connects to SQL Server if DB_ENABLED=true, otherwise Fallbacks to JSON store)
  await db.initialize();

  // REST API Endpoints

  // --- Auth API ---
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, fullName, phone, role } = req.body;
    if (!username || !password || !fullName || !phone || !role) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin đăng ký!" });
    }

    try {
      const users = await db.getUsers();
      const exists = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống!" });
      }

      // Validate phone number format (exactly 10 digits)
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ! Số điện thoại phải gồm đúng 10 chữ số." });
      }

      // Check unique phone number
      const phoneExists = users.find((u: any) => u.phone === phone);
      if (phoneExists) {
        return res.status(400).json({ error: "Số điện thoại này đã được đăng ký bởi một tài khoản khác!" });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = {
        id: "usr-" + Date.now(),
        username,
        password: hashedPassword,
        fullName,
        phone,
        role,
        createdAt: new Date().toISOString()
      };

      await db.addUser(newUser);

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role
      });
    } catch (err: any) {
      res.status(500).json({ error: "Lỗi hệ thống đăng ký: " + err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập tài khoản và mật khẩu!" });
    }

    try {
      const users = await db.getUsers();
      const user = users.find((u: any) => {
        if (u.username.toLowerCase() !== username.toLowerCase()) {
          return false;
        }
        // Check if the stored password matches plain text or is a bcrypt hash that matches
        if (u.password === password) {
          return true;
        }
        if (u.password && (u.password.startsWith("$2b$") || u.password.startsWith("$2a$"))) {
          try {
            return bcrypt.compareSync(password, u.password);
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      if (!user) {
        return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
      }

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role
      });
    } catch (err: any) {
      res.status(500).json({ error: "Lỗi đăng nhập: " + err.message });
    }
  });

  // --- Hanoi Districts & Sports ---
  app.get("/api/districts", async (req, res) => {
    try {
      const districts = await db.getDistricts();
      res.json(districts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await db.getSports();
      res.json(sports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Court Clusters API ---
  app.get("/api/clusters", async (req, res) => {
    const { districtId, sportId, search } = req.query;

    try {
      const court_clusters = await db.getClusters();
      const courts = await db.getCourts();
      const sports = await db.getSports();
      const districts = await db.getDistricts();

      let filtered = court_clusters;

      // Filter only approved unless owner/admin (the query filters approved for consumer discovery)
      filtered = filtered.filter((c: any) => c.status === "approved");

      if (districtId) {
        filtered = filtered.filter((c: any) => c.districtId === districtId);
      }

      if (sportId) {
        // Find clusters that contain courts of the selected sport
        filtered = filtered.filter((cluster: any) => {
          const clusterCourts = courts.filter((crt: any) => crt.clusterId === cluster.id);
          return clusterCourts.some((crt: any) => crt.sportId === sportId);
        });
      }

      if (search) {
        const q = (search as string).toLowerCase();
        filtered = filtered.filter(
          (c: any) =>
            c.name.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        );
      }

      const reviewsAll = await db.getReviews();

      // Attach district name and list of sports inside the cluster for rendering
      const results = filtered.map((c: any) => {
        const dist = districts.find((d: any) => d.id === c.districtId);
        const clusterCourts = courts.filter((crt: any) => crt.clusterId === c.id);
        
        const uniqueSportIds = Array.from(new Set(clusterCourts.map((crt: any) => crt.sportId)));
        const clusterSports = sports.filter((s: any) => uniqueSportIds.includes(s.id));

        // Determine default image if not set or is general placeholder
        let finalImageUrl = c.imageUrl;
        const generalPlaceholder = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";
        if (!finalImageUrl || finalImageUrl === generalPlaceholder) {
          const mainSportId = uniqueSportIds.length > 0 ? uniqueSportIds[0] : undefined;
          finalImageUrl = getDefaultSportImage(c.name, c.description, mainSportId);
        }

        const clusterReviews = reviewsAll.filter((r: any) => r.clusterId === c.id);
        const totalRating = clusterReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
        const avgRating = clusterReviews.length > 0 ? Number((totalRating / clusterReviews.length).toFixed(1)) : 0;

        return {
          ...c,
          imageUrl: finalImageUrl,
          districtName: dist ? dist.name : "Hà Nội",
          sports: clusterSports,
          courtCount: clusterCourts.length,
          minPrice: clusterCourts.length > 0 ? Math.min(...clusterCourts.map((crt: any) => crt.basePrice)) : 0,
          avgRating,
          reviewCount: clusterReviews.length
        };
      });

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/clusters/:id", async (req, res) => {
    try {
      const court_clusters = await db.getClusters();
      const districts = await db.getDistricts();
      const courts = await db.getCourts();
      const sports = await db.getSports();
      const pricingRulesAll = await db.getPricingRules();
      const reviewsAll = await db.getReviews();

      const cluster = court_clusters.find((c: any) => c.id === req.params.id);
      if (!cluster) {
        return res.status(404).json({ error: "Không tìm thấy cụm sân thể thao này!" });
      }

      const dist = districts.find((d: any) => d.id === cluster.districtId);
      const clusterCourts = courts.filter((c: any) => c.clusterId === cluster.id).map((crt: any) => {
        const sport = sports.find((s: any) => s.id === crt.sportId);
        return {
          ...crt,
          sportName: sport ? sport.name : ""
        };
      });
      
      const pricingRules = pricingRulesAll.filter((pr: any) => pr.clusterId === cluster.id);

      // Determine default image if not set or is general placeholder
      let finalImageUrl = cluster.imageUrl;
      const generalPlaceholder = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80";
      if (!finalImageUrl || finalImageUrl === generalPlaceholder) {
        const mainSportId = clusterCourts.length > 0 ? clusterCourts[0].sportId : undefined;
        finalImageUrl = getDefaultSportImage(cluster.name, cluster.description, mainSportId);
      }

      const clusterReviews = reviewsAll.filter((r: any) => r.clusterId === cluster.id);
      const totalRating = clusterReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
      const avgRating = clusterReviews.length > 0 ? Number((totalRating / clusterReviews.length).toFixed(1)) : 0;

      res.json({
        ...cluster,
        imageUrl: finalImageUrl,
        districtName: dist ? dist.name : "Hà Nội",
        courts: clusterCourts,
        pricingRules,
        avgRating,
        reviewCount: clusterReviews.length,
        reviews: clusterReviews
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner submits a new cluster
  app.post("/api/clusters", async (req, res) => {
    const { ownerId, name, districtId, address, imageUrl, description } = req.body;
    if (!ownerId || !name || !districtId || !address || !description) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin cụm sân thể thao!" });
    }

    try {
      const defaultImg = getDefaultSportImage(name, description);
      const newCluster = {
        id: "cc-" + Date.now(),
        ownerId,
        name,
        districtId,
        address,
        imageUrl: imageUrl || defaultImg,
        description,
        status: "pending" as const, // Pending admin approval
        createdAt: new Date().toISOString()
      };

      await db.addCluster(newCluster);
      res.status(201).json(newCluster);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner adds court (sân con) to cluster
  app.post("/api/courts", async (req, res) => {
    const { clusterId, name, sportId, basePrice } = req.body;
    if (!clusterId || !name || !sportId || !basePrice) {
      return res.status(400).json({ error: "Thông tin sân con không hợp lệ!" });
    }

    try {
      const newCourt = {
        id: "c-" + Date.now(),
        clusterId,
        name,
        sportId,
        basePrice: Number(basePrice)
      };

      await db.addCourt(newCourt);
      res.status(201).json(newCourt);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Reviews API ---
  app.get("/api/reviews", async (req, res) => {
    try {
      const clusterId = req.query.clusterId as string;
      const reviews = await db.getReviews(clusterId);
      res.json(reviews);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    const { userId, clusterId, rating, comment, bookingId } = req.body;
    if (!userId || !clusterId || !rating) {
      return res.status(400).json({ error: "Thông tin đánh giá không đầy đủ!" });
    }

    try {
      // Validate booking duplicate reviews
      if (bookingId) {
        const reviewsAll = await db.getReviews();
        const alreadyReviewed = reviewsAll.some((r: any) => r.bookingId === bookingId);
        if (alreadyReviewed) {
          return res.status(400).json({ error: "Lịch đặt sân này đã được đánh giá trước đó! Mỗi lượt chơi chỉ được đánh giá duy nhất một lần." });
        }
      }

      // Validate that the user has a completed booking ("checked_in" status) for any court in this cluster
      const bookings = await db.getBookings();
      const courts = await db.getCourts();
      
      const userBookings = bookings.filter((b: any) => b.customerId === userId && b.status === "checked_in");
      const clusterCourts = courts.filter((c: any) => c.clusterId === clusterId);
      const clusterCourtIds = clusterCourts.map((c: any) => c.id);

      const hasCompletedBooking = userBookings.some((b: any) => clusterCourtIds.includes(b.courtId));

      if (!hasCompletedBooking) {
        return res.status(403).json({ error: "Bạn chỉ có thể đánh giá các sân thể thao mà bạn đã từng đặt và hoàn thành chơi (check-in)!" });
      }

      const users = await db.getUsers();
      const user = users.find((u: any) => u.id === userId);
      const username = user ? user.username : "khachhang";
      const userFullName = user ? user.fullName : "Khách hàng SportZone";

      const newReview = {
        id: "rev-" + Date.now(),
        userId,
        username,
        userFullName,
        clusterId,
        bookingId: bookingId || undefined,
        rating: Number(rating),
        comment: comment || "",
        createdAt: new Date().toISOString()
      };

      const created = await db.addReview(newReview);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Edit & Delete Clusters API ---
  app.put("/api/clusters/:id", async (req, res) => {
    const { name, districtId, address, description, imageUrl } = req.body;
    if (!name || !districtId || !address || !description) {
      return res.status(400).json({ error: "Thông tin cụm sân không đầy đủ!" });
    }

    try {
      await db.updateCluster(req.params.id, name, districtId, address, description, imageUrl || "");
      res.json({ message: "Cập nhật cụm sân thành công!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/clusters/:id", async (req, res) => {
    try {
      await db.deleteCluster(req.params.id);
      res.json({ message: "Xóa cụm sân thành công!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Edit & Delete Courts API ---
  app.put("/api/courts/:id", async (req, res) => {
    const { name, sportId, basePrice } = req.body;
    if (!name || !sportId || !basePrice) {
      return res.status(400).json({ error: "Thông tin sân con không đầy đủ!" });
    }

    try {
      await db.updateCourt(req.params.id, name, sportId, Number(basePrice));
      res.json({ message: "Cập nhật sân con thành công!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/courts/:id", async (req, res) => {
    try {
      await db.deleteCourt(req.params.id);
      res.json({ message: "Xóa sân con thành công!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner configures price rule
  app.post("/api/pricing-rules", async (req, res) => {
    const { clusterId, startHour, endHour, priceMultiplier } = req.body;
    if (!clusterId || startHour === undefined || endHour === undefined || !priceMultiplier) {
      return res.status(400).json({ error: "Thông tin khung giờ tăng giá không hợp lệ!" });
    }

    try {
      const newRule = {
        id: "pr-" + Date.now(),
        clusterId,
        startHour: Number(startHour),
        endHour: Number(endHour),
        priceMultiplier: Number(priceMultiplier)
      };

      await db.addPricingRule(newRule);
      res.status(201).json(newRule);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get available slots for a court on a date
  app.get("/api/courts/:courtId/slots", async (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) {
      return res.status(400).json({ error: "Vui lòng chọn ngày xem lịch!" });
    }

    const courtId = req.params.courtId;
    try {
      const courts = await db.getCourts();
      const court = courts.find((c: any) => c.id === courtId);
      if (!court) {
        return res.status(404).json({ error: "Không tìm thấy sân con!" });
      }

      const clusters = await db.getClusters();
      const cluster = clusters.find((cc: any) => cc.id === court.clusterId);
      
      const pricingRulesAll = await db.getPricingRules();
      const rules = pricingRulesAll.filter((pr: any) => pr.clusterId === cluster?.id);

      const bookingsAll = await db.getBookings();
      // Bookings for this court on this date that are NOT cancelled
      const activeBookings = bookingsAll.filter(
        (b: any) => b.courtId === courtId && b.bookingDate === date && b.status !== "cancelled"
      );

      // Generate slots from 05:00 to 22:00
      const slots = [];
      const hanoi = getHanoiTime();
      for (let hour = 5; hour < 22; hour++) {
        // Check if this hour is already booked
        let isBooked = activeBookings.some((b: any) => hour >= b.startHour && hour < b.endHour);
        
        // Check if this hour is in the past
        const isPast = date < hanoi.dateStr || (date === hanoi.dateStr && hour <= hanoi.hour);
        if (isPast) {
          isBooked = true;
        }

        // Calculate dynamic price for this specific hour
        let price = court.basePrice;
        const rule = rules.find((r: any) => hour >= r.startHour && hour < r.endHour);
        if (rule) {
          price = Math.round(court.basePrice * rule.priceMultiplier);
        }

        slots.push({
          hour,
          label: `${hour.toString().padStart(2, "0")}:00 - ${(hour + 1).toString().padStart(2, "0")}:00`,
          isBooked,
          isPast,
          price,
          isPeak: !!rule
        });
      }

      res.json({
        courtId,
        courtName: court.name,
        date,
        slots
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Real-time Slot Booking API (Overbooking prevention & correct price calculation) ---
  app.post("/api/bookings", async (req, res) => {
    const { customerId, courtId, bookingDate, startHour, endHour, paymentMethod } = req.body;

    if (!customerId || !courtId || !bookingDate || startHour === undefined || endHour === undefined) {
      return res.status(400).json({ error: "Thông tin đặt sân chưa đầy đủ!" });
    }

    if (startHour >= endHour) {
      return res.status(400).json({ error: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc!" });
    }

    // Prevents booking slots in the past
    const hanoi = getHanoiTime();
    if (bookingDate < hanoi.dateStr || (bookingDate === hanoi.dateStr && startHour <= hanoi.hour)) {
      return res.status(400).json({ error: "Không thể đặt sân vào khung giờ đã trôi qua trong ngày!" });
    }

    try {
      const courts = await db.getCourts();
      const court = courts.find((c: any) => c.id === courtId);
      if (!court) {
        return res.status(404).json({ error: "Không tìm thấy sân con được đặt!" });
      }

      const bookingsAll = await db.getBookings();
      // Core prevention engine: Check overlap with active bookings on this court + date
      const overlaps = bookingsAll.filter((b: any) => {
        return (
          b.courtId === courtId &&
          b.bookingDate === bookingDate &&
          b.status !== "cancelled" &&
          // Overlap formula: start1 < end2 AND start2 < end1
          startHour < b.endHour &&
          b.startHour < endHour
        );
      });

      if (overlaps.length > 0) {
        return res.status(409).json({
          error: "Rất tiếc! Khung giờ bạn chọn vừa bị người khác đặt mất. Vui lòng chọn khung giờ hoặc sân khác!"
        });
      }

      // Dynamic price calculation hour-by-hour (supporting multiple pricing rules)
      const clusters = await db.getClusters();
      const cluster = clusters.find((cc: any) => cc.id === court.clusterId);
      
      const pricingRulesAll = await db.getPricingRules();
      const rules = pricingRulesAll.filter((pr: any) => pr.clusterId === cluster?.id);

      let totalPrice = 0;
      for (let h = startHour; h < endHour; h++) {
        let hourPrice = court.basePrice;
        const rule = rules.find((r: any) => h >= r.startHour && h < r.endHour);
        if (rule) {
          hourPrice = Math.round(court.basePrice * rule.priceMultiplier);
        }
        totalPrice += hourPrice;
      }

      const newBooking = {
        id: "b-" + Date.now(),
        customerId,
        courtId,
        bookingDate,
        startHour: Number(startHour),
        endHour: Number(endHour),
        totalPrice,
        status: (paymentMethod ? "paid" : "pending_payment") as any, // Immediately paid if checkout payment selected
        paymentMethod: paymentMethod || undefined,
        createdAt: new Date().toISOString()
      };

      await db.addBooking(newBooking);
      res.status(201).json(newBooking);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Customer booking history
  app.get("/api/bookings/customer/:customerId", async (req, res) => {
    try {
      const bookingsAll = await db.getBookings();
      const bookings = bookingsAll.filter((b: any) => b.customerId === req.params.customerId);
      
      const courts = await db.getCourts();
      const clusters = await db.getClusters();
      const sports = await db.getSports();

      const details = bookings.map((b: any) => {
        const court = courts.find((c: any) => c.id === b.courtId);
        const cluster = court ? clusters.find((cc: any) => cc.id === court.clusterId) : null;
        const sport = court ? sports.find((s: any) => s.id === court.sportId) : null;

        return {
          ...b,
          courtName: court ? court.name : "Sân đã xóa",
          clusterName: cluster ? cluster.name : "Cụm sân đã xóa",
          clusterId: cluster ? cluster.id : "",
          address: cluster ? cluster.address : "",
          sportName: sport ? sport.name : "",
          districtId: cluster ? cluster.districtId : ""
        };
      });

      // Sort by createdAt descending
      details.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Owner booking list
  app.get("/api/bookings/owner/:ownerId", async (req, res) => {
    try {
      const clustersAll = await db.getClusters();
      // Find all clusters owned by this owner
      const clusters = clustersAll.filter((c: any) => c.ownerId === req.params.ownerId);
      const clusterIds = clusters.map((c: any) => c.id);

      const courtsAll = await db.getCourts();
      // Find all courts in these clusters
      const courts = courtsAll.filter((c: any) => clusterIds.includes(c.clusterId));
      const courtIds = courts.map((c: any) => c.id);

      const bookingsAll = await db.getBookings();
      // Find all bookings for these courts
      const bookings = bookingsAll.filter((b: any) => courtIds.includes(b.courtId));

      const users = await db.getUsers();
      const sports = await db.getSports();

      const details = bookings.map((b: any) => {
        const court = courts.find((c: any) => c.id === b.courtId);
        const cluster = court ? clusters.find((cc: any) => cc.id === court.clusterId) : null;
        const customer = users.find((u: any) => u.id === b.customerId);
        const sport = court ? sports.find((s: any) => s.id === court.sportId) : null;

        return {
          ...b,
          courtName: court ? court.name : "",
          clusterName: cluster ? cluster.name : "",
          customerName: customer ? customer.fullName : "Khách vãng lai",
          customerPhone: customer ? customer.phone : "",
          sportName: sport ? sport.name : ""
        };
      });

      details.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update booking status (owner or customer cancels, owner check-in)
  app.post("/api/bookings/:id/status", async (req, res) => {
    const { status, byOwner } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Trạng thái cập nhật không hợp lệ!" });
    }

    try {
      if (status === "cancelled" && !byOwner) {
        const bookingsAll = await db.getBookings();
        const booking = bookingsAll.find((b: any) => b.id === req.params.id);
        if (!booking) {
          return res.status(404).json({ error: "Không tìm thấy lượt đặt sân!" });
        }

        const [year, month, day] = booking.bookingDate.split("-").map(Number);
        // Hanoi is UTC+7, so start time in UTC is startHour - 7
        const bookingUtcTime = Date.UTC(year, month - 1, day, booking.startHour - 7, 0, 0);
        const currentUtcTime = Date.now();

        const diffMs = bookingUtcTime - currentUtcTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 4) {
          return res.status(400).json({
            error: "Bạn chỉ có thể hủy đặt sân trước giờ bắt đầu thi đấu ít nhất 4 tiếng!"
          });
        }
      }

      await db.updateBookingStatus(req.params.id, status);
      
      const bookingsAll = await db.getBookings();
      const updated = bookingsAll.find((b: any) => b.id === req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Owner Stats & Analytics API ---
  app.get("/api/owner/stats/:ownerId", async (req, res) => {
    const ownerId = req.params.ownerId;
    try {
      const clustersAll = await db.getClusters();
      const clusters = clustersAll.filter((c: any) => c.ownerId === ownerId);
      const clusterIds = clusters.map((c: any) => c.id);
      
      const courtsAll = await db.getCourts();
      const courts = courtsAll.filter((c: any) => clusterIds.includes(c.clusterId));
      const courtIds = courts.map((c: any) => c.id);
      
      const bookingsAll = await db.getBookings();
      const bookings = bookingsAll.filter((b: any) => courtIds.includes(b.courtId) && b.status !== "cancelled");

      // Total revenue
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

      // Sports breakdown
      const sports = await db.getSports();
      const sportStats: Record<string, { name: string; revenue: number; count: number }> = {};
      sports.forEach((s: any) => {
        sportStats[s.id] = { name: s.name, revenue: 0, count: 0 };
      });

      bookings.forEach((b: any) => {
        const court = courts.find((crt: any) => crt.id === b.courtId);
        if (court && sportStats[court.sportId]) {
          sportStats[court.sportId].revenue += b.totalPrice;
          sportStats[court.sportId].count += 1;
        }
      });

      // Recent 7 days revenue for daily charts
      const dailyMap: Record<string, { date: string; revenue: number; count: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const dateStr = new Date();
        dateStr.setDate(dateStr.getDate() - i);
        const YYYYMMDD = dateStr.toISOString().split("T")[0];
        dailyMap[YYYYMMDD] = { date: YYYYMMDD, revenue: 0, count: 0 };
      }

      bookings.forEach((b: any) => {
        if (dailyMap[b.bookingDate]) {
          dailyMap[b.bookingDate].revenue += b.totalPrice;
          dailyMap[b.bookingDate].count += 1;
        }
      });

      res.json({
        totalRevenue,
        totalBookings: bookings.length,
        courtCount: courts.length,
        clusterCount: clusters.length,
        sportsStats: Object.values(sportStats),
        dailyStats: Object.values(dailyMap)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Admin API ---
  app.get("/api/admin/clusters", async (req, res) => {
    try {
      const clustersAll = await db.getClusters();
      const users = await db.getUsers();
      const districts = await db.getDistricts();
      const courts = await db.getCourts();

      const results = clustersAll.map((c: any) => {
        const owner = users.find((u: any) => u.id === c.ownerId);
        const dist = districts.find((d: any) => d.id === c.districtId);
        const clusterCourts = courts.filter((crt: any) => crt.clusterId === c.id);
        return {
          ...c,
          ownerName: owner ? owner.fullName : "Chưa rõ",
          districtName: dist ? dist.name : "Hà Nội",
          courtCount: clusterCourts.length
        };
      });
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clusters/:id/status", async (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ!" });
    }

    try {
      await db.updateClusterStatus(req.params.id, status);
      
      const clustersAll = await db.getClusters();
      const updated = clustersAll.find((c: any) => c.id === req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Full system stats for Admin
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const bookingsAll = await db.getBookings();
      const activeBookings = bookingsAll.filter((b: any) => b.status !== "cancelled");
      const totalRevenue = activeBookings.reduce((sum: number, b: any) => sum + b.totalPrice, 0);

      const districts = await db.getDistricts();
      const courts = await db.getCourts();
      const clusters = await db.getClusters();
      const sports = await db.getSports();
      const users = await db.getUsers();

      // Bookings per district for market assessment
      const districtStats: Record<string, { districtName: string; bookingCount: number; revenue: number }> = {};
      districts.forEach((d: any) => {
        districtStats[d.id] = { districtName: d.name, bookingCount: 0, revenue: 0 };
      });

      activeBookings.forEach((b: any) => {
        const court = courts.find((c: any) => c.id === b.courtId);
        const cluster = court ? clusters.find((cc: any) => cc.id === court.clusterId) : null;
        if (cluster && districtStats[cluster.districtId]) {
          districtStats[cluster.districtId].bookingCount += 1;
          districtStats[cluster.districtId].revenue += b.totalPrice;
        }
      });

      // Sports popularity
      const sportStats: Record<string, { sportName: string; bookingCount: number; revenue: number }> = {};
      sports.forEach((s: any) => {
        sportStats[s.id] = { sportName: s.name, bookingCount: 0, revenue: 0 };
      });

      activeBookings.forEach((b: any) => {
        const court = courts.find((c: any) => c.id === b.courtId);
        if (court && sportStats[court.sportId]) {
          sportStats[court.sportId].bookingCount += 1;
          sportStats[court.sportId].revenue += b.totalPrice;
        }
      });

      // Users overview
      const usersCount = users.length;
      const ownersCount = users.filter((u: any) => u.role === "owner").length;
      const customersCount = users.filter((u: any) => u.role === "customer").length;

      res.json({
        totalRevenue,
        totalBookings: activeBookings.length,
        usersCount,
        ownersCount,
        customersCount,
        clusterCount: clusters.length,
        courtCount: courts.length,
        districtStats: Object.values(districtStats).sort((a, b) => b.bookingCount - a.bookingCount),
        sportStats: Object.values(sportStats),
        users: users.map((u: any) => ({ 
          id: u.id, 
          username: u.username, 
          fullName: u.fullName, 
          phone: u.phone, 
          role: u.role, 
          createdAt: u.createdAt 
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userIdToDelete = req.params.id;
      const users = await db.getUsers();
      const user = users.find((u: any) => u.id === userIdToDelete);
      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy người dùng này!" });
      }

      // Safeguard: Prevent deleting the last administrator
      if (user.role === "admin") {
        const admins = users.filter((u: any) => u.role === "admin");
        if (admins.length <= 1) {
          return res.status(400).json({ error: "Không thể xóa tài khoản Admin duy nhất của hệ thống!" });
        }
      }

      await db.deleteUser(userIdToDelete);
      res.json({ message: "Xóa người dùng thành công!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Hanoi SportZone Gemini AI Advisor Endpoint ---
  app.post("/api/gemini/advisor", async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Vui lòng nhập tin nhắn tư vấn!" });
    }

    try {
      const clusters = await db.getClusters();
      const approvedClusters = clusters.filter((cc: any) => cc.status === "approved");
      
      const districts = await db.getDistricts();
      const courts = await db.getCourts();
      const sports = await db.getSports();

      const clusterDetails = approvedClusters.map((cc: any) => {
        const dist = districts.find((d: any) => d.id === cc.districtId);
        const clusterCourts = courts.filter((c: any) => c.clusterId === cc.id);
        return {
          name: cc.name,
          address: cc.address,
          district: dist ? dist.name : "Hà Nội",
          description: cc.description,
          sportsAvailable: Array.from(new Set(clusterCourts.map((c: any) => {
            const s = sports.find((sp: any) => sp.id === c.sportId);
            return s ? s.name : "";
          }))).join(", "),
          minPricePerHour: clusterCourts.length > 0 ? Math.min(...clusterCourts.map((c: any) => c.basePrice)) : "Liên hệ"
        };
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Graceful fallback if API Key is not set yet in workspace
        return res.json({
          response: "Chào bạn! Tôi là Trợ lý ảo SportZone Hà Nội. Hiện tại API Key chưa được cấu hình trong hệ thống (vui lòng thiết lập GEMINI_API_KEY trong Settings > Secrets để trải nghiệm phản hồi AI thời gian thực). \n\nTuy nhiên, dựa trên cơ sở dữ liệu hiện tại, tôi khuyên bạn nên chọn **Cụm Sân Cầu Lông Cầu Giấy** tại quận Cầu Giấy hoặc **Sân Bóng Đại học Y** tại Đống Đa vì đây là hai khu vực thể thao sầm uất và có bảng giá rất hợp lý ở Hà Nội!"
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const systemInstruction = `Bạn là "SportZone Hà Nội AI Advisor", trợ lý ảo tư vấn sân thể thao chuyên nghiệp và tận tâm tại Hà Nội cho hệ thống SportZone Hà Nội.
Bạn có nhiệm vụ tư vấn, giới thiệu sân dựa trên các câu hỏi của người chơi thể thao.
Hãy giữ câu trả lời ngắn gọn, nhiệt tình, lịch sự, đậm chất Hà Nội thanh lịch.
Dưới đây là cơ sở dữ liệu thời gian thực của các cụm sân đang mở cửa hoạt động trong hệ thống để bạn tư vấn chính xác:
${JSON.stringify(clusterDetails, null, 2)}

Nguyên tắc tư vấn:
1. Chỉ giới thiệu các sân nằm trong cơ sở dữ liệu trên.
2. Nêu rõ địa chỉ, quận huyện cụ thể của Hà Nội và ước tính giá tiền nếu có.
3. Nếu người dùng hỏi bộ môn hoặc quận không có trong danh sách, hãy đề xuất lịch sự các lựa chọn gần nhất hoặc đề cập rằng hệ thống đang liên tục cập nhật thêm sân mới tại các quận huyện khác ở Hà Nội.
4. Trình bày đẹp mắt bằng Markdown, sử dụng danh sách gạch đầu dòng rõ ràng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ response: response.text });
    } catch (err: any) {
      console.error("Gemini AI error:", err);
      res.status(500).json({ error: "Có lỗi xảy ra khi kết nối với máy chủ AI: " + err.message });
    }
  });

  // --- Setup Vite Middleware or Static Assets ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SportZone Hanoi server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
