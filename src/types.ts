/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "Laptops" | "New Laptops" | "Refurbished Laptops" | "Phones" | "New Phones" | "Refurbished Phones" | "Printers" | "Accessories" | "All-in-One PCs" | "Desktops" | "New Desktops" | "Refurbished Desktops";
  price: number;
  stock: number;
  description: string;
  image: string;
  sku?: string;
  gallery?: string[]; // Up to 5 images total (image + 4 extra gallery images)
  specifications: Record<string, string>;
  tags?: string[];
  rating?: number;
  reviews?: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  mpesaPhone: string;
  receiptNo?: string;
  paymentStatus: "Pending" | "Paid" | "Failed";
  shippingStatus: "Processing" | "Shipped" | "Delivered";
  referralCode?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  createdAt?: any;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  active: boolean;
  createdAt: string;
}

export interface ProductReview {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ActivityLog {
  id?: string;
  type: "page_view" | "search";
  target: string;
  userId?: string;
  createdAt: string;
}

