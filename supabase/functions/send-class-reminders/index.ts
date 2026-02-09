import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find events starting in ~48 hours (window: 47-49 hours from now)
    const now = new Date();
    const from48h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
    const to48h = new Date(now.getTime() + 49 * 60 * 60 * 1000);

    // Get upcoming events in the 48h window
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, start_time, venue_address")
      .gte("start_time", from48h.toISOString())
      .lte("start_time", to48h.toISOString())
      .eq("status", "upcoming");

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${events?.length || 0} events in 48h window`);

    let emailsSent = 0;

    for (const event of events || []) {
      // Get bookings for this event
      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("event_id", event.id)
        .in("status", ["confirmed", "paid", "pending"]);

      if (!bookings || bookings.length === 0) continue;

      const userIds = bookings.map(b => b.user_id);

      // Get user emails
      for (const userId of userIds) {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        if (!user?.email) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", userId)
          .single();

        const userName = profile?.first_name || "Dancer";
        const eventDate = new Date(event.start_time).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        const html = `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
                  <tr><td style="background:linear-gradient(135deg,#ff6b35,#f7931e);padding:30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;">⏰ Event Reminder</h1>
                  </td></tr>
                  <tr><td style="padding:40px 30px;">
                    <p style="color:#666;font-size:16px;">Hi ${userName},</p>
                    <p style="color:#666;font-size:16px;">This is a friendly reminder that your event is coming up in <strong>48 hours</strong>!</p>
                    <div style="background:#f8f9fa;border-left:4px solid #ff6b35;padding:20px;margin:20px 0;border-radius:4px;">
                      <h3 style="color:#333;margin:0 0 10px;">${event.title}</h3>
                      <p style="color:#666;margin:0 0 5px;">📅 ${eventDate}</p>
                      ${event.venue_address ? `<p style="color:#666;margin:0;">📍 ${event.venue_address}</p>` : ""}
                    </div>
                    <p style="color:#666;">Don't forget to prepare and arrive on time. See you there!</p>
                    <p style="color:#666;">Best regards,<br><strong>The Dance Well Team</strong></p>
                  </td></tr>
                  <tr><td style="background:#f8f9fa;padding:20px;text-align:center;">
                    <p style="color:#999;font-size:12px;">Dance Well | well.dance.classic@gmail.com</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Dance Well <onboarding@resend.dev>",
            to: [user.email],
            subject: `Reminder: ${event.title} is in 48 hours!`,
            html,
          }),
        });

        if (res.ok) {
          emailsSent++;
          // Create in-app notification too
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "reminder",
            title: "Event Reminder",
            message: `${event.title} is coming up in 48 hours! Don't forget to prepare.`,
          });
        }
      }
    }

    console.log(`Sent ${emailsSent} reminder emails`);

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
