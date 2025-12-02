import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Smartphone } from "lucide-react";

interface MobilePaymentProps {
  amount: number;
  enrollmentId?: string;
  bookingId?: string;
  userId: string;
  onPaymentInitiated: () => void;
}

export default function MobilePayment({ amount, enrollmentId, bookingId, userId, onPaymentInitiated }: MobilePaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"mtn" | "tigo" | null>(null);
  const { toast } = useToast();

  const businessNumber = "119966565";

  const generateUSSD = (method: "mtn" | "tigo") => {
    if (method === "mtn") {
      return `*182*8*1*${businessNumber}*${amount}#`;
    } else {
      return `*150*01*${businessNumber}*${amount}#`;
    }
  };

  const handlePayment = (method: "mtn" | "tigo") => {
    if (!phoneNumber) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }

    setSelectedMethod(method);
    const ussdCode = generateUSSD(method);

    // Auto-dial USSD
    window.location.href = `tel:${encodeURIComponent(ussdCode)}`;

    // Save payment record
    savePaymentRecord(method, ussdCode);

    toast({
      title: "Payment Initiated",
      description: "Please complete the payment on your phone",
    });

    onPaymentInitiated();
  };

  const savePaymentRecord = async (method: "mtn" | "tigo", ussdCode: string) => {
    const { supabase } = await import("@/integrations/supabase/client");
    
    await supabase.from("mobile_payments").insert({
      enrollment_id: enrollmentId || null,
      booking_id: bookingId || null,
      user_id: userId,
      amount,
      payment_method: method,
      phone_number: phoneNumber,
      ussd_code: ussdCode,
      status: "pending",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Payment
        </CardTitle>
        <CardDescription>
          Pay {amount} RWF using MTN Mobile Money or Tigo Cash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <Input
            type="tel"
            placeholder="07XX XXX XXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={10}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handlePayment("mtn")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            disabled={!phoneNumber}
          >
            <div className="text-center">
              <div className="font-bold">MTN</div>
              <div className="text-xs">Mobile Money</div>
            </div>
          </Button>

          <Button
            onClick={() => handlePayment("tigo")}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!phoneNumber}
          >
            <div className="text-center">
              <div className="font-bold">Tigo</div>
              <div className="text-xs">Cash</div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          {selectedMethod && (
            <p>
              Dial: <code className="bg-muted px-2 py-1 rounded">{generateUSSD(selectedMethod)}</code>
            </p>
          )}
          <p className="mt-2">Your phone will automatically dial the USSD code</p>
        </div>
      </CardContent>
    </Card>
  );
}