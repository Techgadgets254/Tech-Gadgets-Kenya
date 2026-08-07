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
  enableVariants?: boolean;
  customVariants?: {
    label: string;
    options: {
      name: string;
      price: number;
    }[];
  };
  variants?: {
    id: string;
    ram?: string;
    ssd?: string;
    sku?: string;
    selections?: Record<string, string>;
    price: number;
    stock: number;
  }[];
  variantGroups?: {
    name: string;
    options: string[];
  }[];
  reviews?: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  flashPrice?: number | null;
  flashStart?: string | null;
  flashExpiry?: string | null;
  flashBanner?: string | null;
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
  paymentProvider?: string;
  courierName?: string;
  courierWaybill?: string;
  courierPhone?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  wishlist?: string[];
  phone?: string;
  address?: string;
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

export interface TransactionFeedback {
  id?: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CompanyProfile {
  id?: string;
  name: string;
  logoUrl: string;
  taxPin: string;
  address: string;
  email: string;
  phone: string;
  updatedAt: string;
}

export interface CartToast {
  id: string;
  productName: string;
  productImage: string;
  price: number;
}

export interface BrowsingHistoryItem {
  id?: string;
  userId: string;
  productId: string;
  productName?: string;
  category?: string;
  brand?: string;
  viewedAt: string;
}



