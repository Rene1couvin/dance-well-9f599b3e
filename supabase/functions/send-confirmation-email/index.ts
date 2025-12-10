import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  type: "booking" | "enrollment";
  userId: string;
  itemTitle: string;
  itemDetails?: string;
  amount?: number;
  currency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-confirmation-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, userId, itemTitle, itemDetails, amount, currency }: ConfirmationEmailRequest = await req.json();

    console.log(`Sending ${type} confirmation email to user ${userId}`);

    // Fetch user profile to get email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, username")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Failed to fetch user email");
    }

    const userName = profile?.first_name || profile?.username || "Dancer";
    const userEmail = user.email;

    const isBooking = type === "booking";
    const subject = isBooking 
      ? `Your Event Booking is Confirmed - ${itemTitle}`
      : `Your Class Enrollment is Confirmed - ${itemTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Dance Well</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your Dance Journey Awaits</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
                        ${isBooking ? "🎉 Booking Confirmed!" : "✅ Enrollment Confirmed!"}
                      </h2>
                      
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${userName},
                      </p>
                      
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Great news! Your ${isBooking ? "event booking" : "class enrollment"} has been confirmed.
                      </p>
                      
                      <!-- Details Box -->
                      <div style="background-color: #f8f9fa; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">${itemTitle}</h3>
                        ${itemDetails ? `<p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">${itemDetails}</p>` : ""}
                        ${amount ? `<p style="color: #ff6b35; font-weight: bold; margin: 0; font-size: 16px;">Amount: ${amount} ${currency || "RWF"}</p>` : ""}
                      </div>
                      
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        ${isBooking 
                          ? "We look forward to seeing you at the event. Make sure to arrive on time!"
                          : "Get ready to dance! We're excited to have you in class."}
                      </p>
                      
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br>
                        <strong>The Dance Well Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
                        Dance Well - Learn to dance with passion
                      </p>
                      <p style="color: #999; font-size: 12px; margin: 0;">
                        📧 well.dance.classic@gmail.com | 📞 +250 788 630 520
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log(`Sending email to ${userEmail}`);

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Dance Well <onboarding@resend.dev>",
        to: [userEmail],
        subject: subject,
        html: html,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);