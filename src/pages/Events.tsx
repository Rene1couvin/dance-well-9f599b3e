import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import MobilePayment from "@/components/MobilePayment";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
      .select("event_id, status")
      .eq("user_id", user.id);

    if (data) {
      setBookings(data);
    }
  };

  const getBookingStatus = (eventId: string) => {
    const booking = bookings.find((b) => b.event_id === eventId);
    return booking ? booking.status : null;
  };

  const handleBook = async (event: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if already booked
    const existingBooking = bookings.find((b) => b.event_id === event.id);
    if (existingBooking) {
      toast({
        title: "Already Booked",
        description: "You have already booked this event",
      });
      return;
    }

    // If event is paid, create pending booking and show payment
    if (event.is_paid && event.price > 0) {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: "pending",
          amount: event.price,
          currency: event.currency,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSelectedEvent(event);
      setBookingId(booking.id);
      setShowPayment(true);
    } else {
      // Free event - create confirmed booking directly
      const { error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          event_id: event.id,
          status: "pending", // Still pending until admin confirms
          amount: 0,
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
        title: "Booking Submitted",
        description: "Your booking is pending admin confirmation",
      });

      fetchBookings();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
                  const bookingStatus = getBookingStatus(event.id);
                  
                  return (
                    <Card key={event.id} className="hover:shadow-elegant transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge>{event.class_category || "Event"}</Badge>
                          {bookingStatus && getStatusBadge(bookingStatus)}
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
                        
                        {/* Payment Method Display */}
                        {event.is_paid && event.price > 0 && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Payment: MTN Mobile Money / Tigo Cash
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="text-2xl font-bold text-primary">
                            {event.price > 0 ? `${event.price} ${event.currency}` : "Free"}
                          </span>
                          {bookingStatus ? (
                            getStatusBadge(bookingStatus)
                          ) : (
                            <Button onClick={() => handleBook(event)}>
                              {user ? "Book Now" : "Sign in to Book"}
                            </Button>
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

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-[500px]">
          <MobilePayment
            amount={selectedEvent?.price || 0}
            bookingId={bookingId || undefined}
            userId={user?.id || ""}
            onPaymentInitiated={() => {
              setShowPayment(false);
              toast({
                title: "Booking Pending",
                description: "Complete payment and wait for admin confirmation",
              });
              fetchBookings();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;
