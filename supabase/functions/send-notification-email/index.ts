import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  type: "signup" | "enrollment" | "booking";
  data: {
    userName?: string;
    className?: string;
    eventTitle?: string;
    eventDate?: string;
    eventLocation?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: NotificationRequest = await req.json();
    console.log(`Sending ${type} notification to ${to}`);

    let subject = "";
    let html = "";

    switch (type) {
      case "signup":
        subject = "Welcome to Dance Well! 💃🕺";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8b5cf6;">Welcome to Dance Well, ${data.userName}!</h1>
            <p>Thank you for joining our vibrant dance community. We're excited to have you!</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Browse our <strong>Classes</strong> and find the perfect style for you</li>
              <li>Check out upcoming <strong>Events</strong> and social dances</li>
              <li>Complete your <strong>Profile</strong> to connect with other dancers</li>
            </ul>
            <p>See you on the dance floor!</p>
            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}" 
                 style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Explore Dance Well
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The Dance Well Team
            </p>
          </div>
        `;
        break;

      case "enrollment":
        subject = `Class Enrollment Confirmed: ${data.className} ✅`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8b5cf6;">Enrollment Confirmed! 🎉</h1>
            <p>Hi ${data.userName},</p>
            <p>You've successfully enrolled in <strong>${data.className}</strong>!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Class Details</h2>
              <p style="margin: 8px 0;"><strong>Class:</strong> ${data.className}</p>
            </div>
            <p>We can't wait to see you at class! If you have any questions, feel free to reach out.</p>
            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}/profile" 
                 style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Your Classes
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The Dance Well Team
            </p>
          </div>
        `;
        break;

      case "booking":
        subject = `Event Booking Confirmed: ${data.eventTitle} 🎊`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #8b5cf6;">Booking Confirmed! 🎊</h1>
            <p>Hi ${data.userName},</p>
            <p>Your booking for <strong>${data.eventTitle}</strong> has been confirmed!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Event Details</h2>
              <p style="margin: 8px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${data.eventDate}</p>
              <p style="margin: 8px 0;"><strong>Location:</strong> ${data.eventLocation}</p>
            </div>
            <p>We're excited to see you at the event! Make sure to arrive on time and bring your dancing shoes.</p>
            <p style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")}/events" 
                 style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Event Details
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The Dance Well Team
            </p>
          </div>
        `;
        break;

      default:
        throw new Error("Invalid notification type");
    }

    const emailResponse = await resend.emails.send({
      from: "Dance Well <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
