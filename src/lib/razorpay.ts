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
  order_id?: string; // Optional - can use amount directly
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

// Create Razorpay order via Supabase Edge Function
// NOTE: Razorpay API cannot be called directly from browser due to CORS
// Must use backend (Supabase Edge Function) to create orders
export const createRazorpayOrder = async (amount: number, receipt: string): Promise<RazorpayOrderResponse | null> => {
  // Try Supabase Edge Function first (recommended)
  try {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('User not authenticated, will use checkout without order');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount, currency: 'INR', receipt },
    });

    if (error) {
      // Edge Function doesn't exist or failed - this is OK, we'll use checkout without order
      // CORS errors are expected if Edge Function is not set up
      if (error.message?.includes('CORS') || error.message?.includes('Failed to send')) {
        console.warn('Edge Function not available (CORS error - this is OK if not set up), will use checkout without order');
      } else {
        console.warn('Edge Function not available (this is OK if not set up), will use checkout without order:', error.message);
      }
      return null;
    }

    if (data && data.id) {
      console.log('Razorpay order created via Edge Function:', data.id);
      return data;
    }

    return null;
  } catch (error: any) {
    // Edge Function doesn't exist - this is expected if not set up
    // Silently fall back to checkout without order
    console.warn('Edge Function not set up (this is OK), will use checkout without order');
    return null;
  }
};

// Verify Razorpay payment via Supabase Edge Function
export const verifyRazorpayPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  order_id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { supabase } = await import('./supabase');

    // Validate parameters before sending
    console.log('Payment verification parameters received:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      const missing = [];
      if (!razorpay_order_id) missing.push('razorpay_order_id');
      if (!razorpay_payment_id) missing.push('razorpay_payment_id');
      if (!razorpay_signature) missing.push('razorpay_signature');
      if (!order_id) missing.push('order_id');

      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }

    // Log what we're about to send
    const requestBody = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    };

    console.log('Calling verify-razorpay-payment Edge Function');

    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: requestBody,
    });

    if (error) {
      // Log the full error object to see what's available
      console.error('Edge Function Error:', error);
      console.error('Error context:', JSON.stringify(error.context || {}));

      // Try to extract error details
      let errorMessage = error.message || 'Verification failed';

      // Check if we have additional error details in the context
      if (error.context && typeof error.context === 'object') {
        const body = error.context.body;
        if (body && typeof body === 'object' && body.error) {
          errorMessage = body.error;
          console.error('Extracted error from body:', errorMessage);
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('Payment verification failed:', error);

    // Enhanced error extraction
    let errorMessage = error.message || "Payment verification failed";
    let errorDetails = null;

    // Try to extract error from FunctionsHttpError
    if (error.context) {
      console.log('Error has context:', error.context);

      // Try to get error from response body
      if (error.context.body) {
        try {
          const body = typeof error.context.body === 'string'
            ? JSON.parse(error.context.body)
            : error.context.body;

          if (body.error) {
            errorMessage = body.error;
            errorDetails = body.details;
            console.log('Extracted error from body:', { errorMessage, errorDetails });
          }
        } catch (parseError) {
          console.error('Could not parse error body:', parseError);
        }
      }
    }

    // If we have details, log them
    if (errorDetails) {
      console.error('Error details:', errorDetails);
    }

    return { success: false, error: errorMessage };
  }
};

// Simulate payment success for testing (development only)
export const simulatePaymentSuccess = (
  orderId: string | null,
  onSuccess: (response: RazorpayPaymentResponse) => void
) => {
  // Generate mock payment response
  const mockResponse: RazorpayPaymentResponse = {
    razorpay_payment_id: `pay_test_${Date.now()}`,
    razorpay_order_id: orderId || `order_test_${Date.now()}`,
    razorpay_signature: `sig_test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  // Call success handler after a short delay to simulate async behavior
  setTimeout(() => {
    onSuccess(mockResponse);
  }, 500);
};

// Initialize Razorpay checkout
// Can work with or without order_id (if order_id is null, Razorpay creates order automatically)
export const openRazorpayCheckout = async (
  orderId: string | null,
  amount: number,
  onSuccess: (response: RazorpayPaymentResponse) => void,
  onError: (error: any) => void,
  prefillData?: { name?: string; email?: string; contact?: string },
  skipPayment?: boolean // Test mode: skip actual payment
) => {
  // Test mode: Skip payment and simulate success
  if (skipPayment || import.meta.env.DEV) {
    const enableTestMode = import.meta.env.VITE_ENABLE_TEST_PAYMENT_BYPASS === 'true';
    if (enableTestMode) {
      console.log('🧪 TEST MODE: Bypassing payment, simulating success...');
      simulatePaymentSuccess(orderId, onSuccess);
      return;
    }
  }

  try {
    await loadRazorpayScript();

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      throw new Error('Razorpay key not configured');
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      throw new Error('Minimum amount is ₹1.00');
    }

    // Validate Razorpay key format
    if (!razorpayKey.startsWith('rzp_test_') && !razorpayKey.startsWith('rzp_live_')) {
      console.warn('Razorpay key format may be invalid. Expected rzp_test_ or rzp_live_ prefix.');
    }

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Jager Clothing',
      description: 'Order Payment',
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

    // Add order_id if provided, otherwise Razorpay will create order automatically
    if (orderId) {
      options.order_id = orderId;
      console.log('Using Razorpay order_id:', orderId);
    } else {
      // When no order_id, add receipt for tracking
      // Razorpay will create order automatically with this receipt
      const receipt = `receipt_${Date.now()}`;
      (options as any).receipt = receipt;
      console.log('No order_id provided, Razorpay will create order automatically. Receipt:', receipt);
    }

    // Log checkout options for debugging (without sensitive data)
    console.log('Opening Razorpay checkout with options:', {
      key: razorpayKey.substring(0, 10) + '...',
      amount: amountInPaise,
      currency: options.currency,
      order_id: options.order_id || 'auto-create',
      receipt: (options as any).receipt || 'none',
    });

    const razorpay = new window.Razorpay(options);

    // Add comprehensive error handlers for Razorpay
    razorpay.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response);

      // Log full error details for debugging
      console.group('🔍 Razorpay Error Details');
      console.log('Full response:', JSON.stringify(response, null, 2));
      if (response.error) {
        console.log('Error object:', response.error);
        console.log('Error description:', response.error.description);
        console.log('Error reason:', response.error.reason);
        console.log('Error code:', response.error.code);
        console.log('Error source:', response.error.source);
        console.log('Error step:', response.error.step);
      }
      if (response.metadata) {
        console.log('Metadata:', response.metadata);
      }
      console.groupEnd();

      // Extract error message from various possible locations
      let errorMessage = 'Payment failed';

      if (response.error) {
        // Check multiple possible error message locations
        errorMessage = response.error.description ||
          response.error.reason ||
          response.error.field ||
          response.error.source ||
          response.error.step ||
          response.error.metadata?.error_description ||
          (response.error.code ? `Error code: ${response.error.code}` : '') ||
          JSON.stringify(response.error);
      } else if (response.metadata?.error_description) {
        errorMessage = response.metadata.error_description;
      } else if (typeof response === 'string') {
        errorMessage = response;
      }

      // Handle specific error cases based on error code and reason
      const errorCode = response.error?.code;
      const errorReason = response.error?.reason;

      if (errorReason === 'international_transaction_not_allowed' ||
        errorCode === 'BAD_REQUEST_ERROR' && errorMessage.toLowerCase().includes('international')) {
        // Specific handling for international card restriction
        if (import.meta.env.DEV) {
          errorMessage = 'International cards are not supported in test mode. For testing, use Indian test card: 4111 1111 1111 1111 (CVV: 123, Expiry: 12/25). For production, contact Razorpay support to enable international cards.';
        } else {
          errorMessage = 'International cards are not currently supported. Please use an Indian card or contact our support team for alternative payment methods.';
        }
      } else if (errorMessage.toLowerCase().includes('international') ||
        errorMessage.toLowerCase().includes('not supported')) {
        errorMessage = 'International cards are not supported. Please use an Indian card or contact support for alternative payment methods.';
      } else if (errorMessage.toLowerCase().includes('card declined') ||
        errorMessage.toLowerCase().includes('declined')) {
        errorMessage = 'Your card was declined. Please try a different card or contact your bank.';
      } else if (errorMessage.toLowerCase().includes('insufficient funds')) {
        errorMessage = 'Insufficient funds. Please try a different payment method.';
      } else if (errorMessage.toLowerCase().includes('expired')) {
        errorMessage = 'Your card has expired. Please use a different card.';
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        errorMessage = 'Invalid card details. Please check and try again.';
      }

      onError(new Error(errorMessage));
    });

    // Handle other Razorpay errors
    razorpay.on('payment.authorized', () => {
      // This is handled by the success handler
    });

    razorpay.open();
  } catch (error: any) {
    console.error('Error opening Razorpay checkout:', error);

    // Extract better error message
    let errorMessage = 'Failed to open payment gateway';

    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.error?.description) {
      errorMessage = error.error.description;
    }

    onError(new Error(errorMessage));
  }
};

