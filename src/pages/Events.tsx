import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "upcoming")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
      return;
    }

    setEvents(data || []);
    setLoading(false);
  };

  const fetchBookings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookings")
      .select("event_id")
      .eq("user_id", user.id);

    if (data) {
      setBookings(data.map((b) => b.event_id));
    }
  };

  const handleBook = async (event: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // If event has payment, redirect to payment URL
    if (event.is_paid && event.payment_redirect_url) {
      window.location.href = event.payment_redirect_url;
      return;
    }

    // Otherwise, create booking directly
    const { error } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        event_id: event.id,
        status: event.is_paid ? "pending" : "confirmed",
        amount: event.price,
        currency: event.currency,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: event.is_paid
        ? "Your booking is pending payment"
        : "You've successfully booked this event!",
    });

    fetchBookings();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-subtle">
          <div className="container">
            <h1 className="text-5xl font-bold mb-6 text-center">Upcoming Events</h1>
            <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Don't miss out on our exciting dance events and workshops!
            </p>

            {loading ? (
              <p className="text-center">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-center text-muted-foreground">No upcoming events at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.map((event) => {
                  const isBooked = bookings.includes(event.id);
                  
                  return (
                    <Card key={event.id} className="hover:shadow-elegant transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge>{event.class_category || "Event"}</Badge>
                        </div>
                        <CardTitle className="text-2xl">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(event.start_time), "MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.start_time), "h:mm a")}
                              {event.end_time && ` - ${format(new Date(event.end_time), "h:mm a")}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            {event.venue_address && (
                              <p className="text-sm">{event.venue_address}</p>
                            )}
                            {event.online_link && (
                              <a 
                                href={event.online_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Join Online
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="text-2xl font-bold text-primary">
                            {event.price > 0 ? `${event.price} ${event.currency}` : "Free"}
                          </span>
                          {isBooked ? (
                            <Button variant="outline" disabled>Booked</Button>
                          ) : (
                            <Button onClick={() => handleBook(event)}>Book Now</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
