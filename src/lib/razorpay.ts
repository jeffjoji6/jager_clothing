// Razorpay integration utilities
// Note: Razorpay requires backend API to create orders securely
// This file contains frontend utilities for Razorpay checkout

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

// Create Razorpay order (should be called from backend API)
// For now, this is a placeholder - in production, create order on backend
export const createRazorpayOrder = async (amount: number, receipt: string): Promise<RazorpayOrderResponse> => {
  // In production, this should call your backend API
  // Example: const response = await fetch('/api/create-razorpay-order', { ... });
  // For now, returning mock data structure
  throw new Error('createRazorpayOrder must be implemented on backend');
};

// Initialize Razorpay checkout
export const openRazorpayCheckout = async (
  orderId: string,
  amount: number,
  onSuccess: (response: RazorpayPaymentResponse) => void,
  onError: (error: any) => void,
  prefillData?: { name?: string; email?: string; contact?: string }
) => {
  try {
    await loadRazorpayScript();

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      throw new Error('Razorpay key not configured');
    }

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      name: 'JÄGER CLOTHING',
      description: 'Order Payment',
      order_id: orderId,
      handler: onSuccess,
      prefill: prefillData,
      theme: {
        color: '#DC2626', // jager-red
      },
      modal: {
        ondismiss: () => {
          onError(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onError(error);
  }
};

