/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  CUSTOMER = 'customer',
  OWNER = 'owner',
  ADMIN = 'admin'
}

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled'
}

export enum ClusterStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Sport {
  id: string;
  name: string;
  iconName: string; // lucide icon name
}

export interface CourtCluster {
  id: string;
  ownerId: string;
  name: string;
  districtId: string;
  address: string;
  imageUrl: string;
  description: string;
  status: ClusterStatus;
  createdAt: string;
  avgRating?: number;
  reviewCount?: number;
}

export interface Court {
  id: string;
  clusterId: string;
  name: string;
  sportId: string;
  basePrice: number; // Đơn giá cơ bản một giờ (VND)
}

export interface PricingRule {
  id: string;
  clusterId: string;
  startHour: number; // Ví dụ: 17
  endHour: number;   // Ví dụ: 21
  priceMultiplier: number; // Hệ số nhân giá cao điểm (ví dụ: 1.3)
}

export interface Booking {
  id: string;
  customerId: string;
  courtId: string;
  bookingDate: string; // YYYY-MM-DD
  startHour: number;   // Giờ bắt đầu (0-23)
  endHour: number;     // Giờ kết thúc (0-23)
  totalPrice: number;
  status: BookingStatus;
  paymentMethod?: string; // momo, vnpay, transfer
  createdAt: string;
}

// Stats interface for dashboard
export interface DistrictBookingStat {
  districtName: string;
  bookingCount: number;
  revenue: number;
}

export interface DayRevenueStat {
  date: string;
  revenue: number;
  bookingCount: number;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  clusterId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
