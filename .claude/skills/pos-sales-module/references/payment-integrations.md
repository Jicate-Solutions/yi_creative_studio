# Payment Integration Patterns

## Payment Service Interface

```tsx
// services/payment.service.ts
export interface PaymentProvider {
  name: string;
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  refundPayment(transactionId: string, amount: number): Promise<RefundResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  method: 'card' | 'upi' | 'wallet';
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  status: 'completed' | 'pending' | 'failed';
  message?: string;
  receipt_url?: string;
}
```

## Cash Payment

```tsx
// Simple cash payment - no integration needed
export async function processCashPayment(
  amount: number,
  cashReceived: number
): Promise<PaymentResponse> {
  if (cashReceived < amount) {
    return {
      success: false,
      transaction_id: '',
      status: 'failed',
      message: 'Insufficient cash received',
    };
  }

  return {
    success: true,
    transaction_id: `CASH-${Date.now()}`,
    status: 'completed',
    message: `Change: ${formatCurrency(cashReceived - amount)}`,
  };
}
```

## Razorpay Integration

```tsx
// services/razorpay.service.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(amount: number) {
  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay expects paise
    currency: 'INR',
    receipt: `order_${Date.now()}`,
  });
  return order;
}

// Client-side component
export function RazorpayButton({
  amount,
  onSuccess,
  onFailure,
}: {
  amount: number;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}) {
  const handlePayment = async () => {
    // Create order on server
    const response = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    const order = await response.json();

    // Open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Store Name',
      description: 'Purchase',
      order_id: order.id,
      handler: function (response: any) {
        // Verify payment on server
        verifyPayment(response).then(onSuccess).catch(onFailure);
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#0b6d41',
      },
    };

    const razorpayInstance = new (window as any).Razorpay(options);
    razorpayInstance.open();
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold"
    >
      Pay with Razorpay
    </button>
  );
}
```

## UPI Payment (QR Code)

```tsx
// components/pos/UPIPayment.tsx
import QRCode from 'qrcode.react';

interface UPIPaymentProps {
  amount: number;
  merchantUPI: string;
  merchantName: string;
  onVerify: () => void;
}

export function UPIPayment({
  amount,
  merchantUPI,
  merchantName,
  onVerify,
}: UPIPaymentProps) {
  // Generate UPI deep link
  const upiLink = `upi://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;

  return (
    <div className="text-center p-6">
      <p className="text-sm text-gray-500 mb-4">Scan QR code to pay</p>

      <div className="bg-white p-4 rounded-lg inline-block shadow">
        <QRCode
          value={upiLink}
          size={200}
          level="H"
          includeMargin
        />
      </div>

      <p className="text-2xl font-bold mt-4">{formatCurrency(amount)}</p>
      <p className="text-sm text-gray-500 mt-1">UPI ID: {merchantUPI}</p>

      <button
        onClick={onVerify}
        className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-medium"
      >
        I've completed the payment
      </button>
    </div>
  );
}
```

## Split Payment

```tsx
// components/pos/SplitPayment.tsx
interface SplitPaymentProps {
  totalAmount: number;
  onComplete: (payments: SplitPaymentItem[]) => void;
}

interface SplitPaymentItem {
  method: 'cash' | 'card' | 'upi';
  amount: number;
  completed: boolean;
}

export function SplitPayment({ totalAmount, onComplete }: SplitPaymentProps) {
  const [payments, setPayments] = useState<SplitPaymentItem[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [currentAmount, setCurrentAmount] = useState('');

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - paidAmount;

  const addPayment = () => {
    const amount = parseFloat(currentAmount);
    if (amount <= 0 || amount > remainingAmount) return;

    setPayments([...payments, {
      method: currentMethod,
      amount,
      completed: false,
    }]);
    setCurrentAmount('');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span>Total</span>
          <span className="font-bold">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between mb-2 text-green-600">
          <span>Paid</span>
          <span>{formatCurrency(paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Remaining</span>
          <span className="text-primary">{formatCurrency(remainingAmount)}</span>
        </div>
      </div>

      {/* Added payments */}
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">{payment.method}</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              <button
                onClick={() => removePayment(index)}
                className="text-red-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add payment */}
      {remainingAmount > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'card', 'upi'] as const).map(method => (
              <button
                key={method}
                onClick={() => setCurrentMethod(method)}
                className={cn(
                  "py-2 rounded-lg border-2 capitalize",
                  currentMethod === method
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                )}
              >
                {method}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder={`Max: ${formatCurrency(remainingAmount)}`}
              className="flex-1 px-4 py-3 border rounded-lg"
            />
            <button
              onClick={addPayment}
              disabled={!currentAmount || parseFloat(currentAmount) <= 0}
              className="px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <button
            onClick={() => setCurrentAmount(remainingAmount.toString())}
            className="w-full py-2 text-sm text-primary hover:underline"
          >
            Use remaining amount ({formatCurrency(remainingAmount)})
          </button>
        </div>
      )}

      {/* Complete */}
      {remainingAmount === 0 && (
        <button
          onClick={() => onComplete(payments)}
          className="w-full py-4 bg-primary text-white rounded-lg font-semibold"
        >
          Complete Split Payment
        </button>
      )}
    </div>
  );
}
```

## Payment API Routes

```tsx
// app/api/payments/process/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { sale_id, method, amount, cash_received, reference_number } = body;

  // Validate sale exists
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('id, total, payment_status')
    .eq('id', sale_id)
    .single();

  if (saleError || !sale) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  }

  if (sale.payment_status === 'completed') {
    return NextResponse.json({ error: 'Sale already paid' }, { status: 400 });
  }

  // Record payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      sale_id,
      method,
      amount,
      cash_received: method === 'cash' ? cash_received : null,
      change_given: method === 'cash' ? Math.max(0, cash_received - amount) : null,
      reference_number,
      status: 'completed',
    })
    .select()
    .single();

  if (paymentError) {
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }

  // Update sale status
  await supabase
    .from('sales')
    .update({ payment_status: 'completed' })
    .eq('id', sale_id);

  // Update inventory (deduct stock)
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .eq('sale_id', sale_id);

  if (saleItems) {
    for (const item of saleItems) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }

  return NextResponse.json({ success: true, payment });
}
```

## Card Terminal Integration (Mock)

```tsx
// For physical card terminals, you'd integrate with their SDK
// This is a mock for testing

export async function processCardPayment(
  amount: number,
  terminalId: string
): Promise<PaymentResponse> {
  // In production, this would communicate with the card terminal
  // via SDK or API provided by the terminal manufacturer

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock success (80% success rate for testing)
  const success = Math.random() > 0.2;

  return {
    success,
    transaction_id: success ? `CARD-${Date.now()}` : '',
    status: success ? 'completed' : 'failed',
    message: success ? 'Payment approved' : 'Card declined',
  };
}
```
