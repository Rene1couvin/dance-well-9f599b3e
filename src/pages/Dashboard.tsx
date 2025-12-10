import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BookOpen, CreditCard, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Enrollment {
  id: string;
  class_id: string;
  enrolled_at: string;
  payment_status: string;
  classes: {
    title: string;
    category: string;
    schedule: string;
    location: string;
    regular_price: number;
    private_price: number;
    currency: string;
  };
  class_enrollment_schedule?: {
    selected_days: string[];
  }[];
}

interface Booking {
  id: string;
  event_id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  events: {
    title: string;
    start_time: string;
    venue_address: string;
    class_category: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch enrollments
    const { data: enrollmentsData } = await supabase
      .from("class_enrollments")
      .select(`
        *,
        classes:class_id (
          title,
          category,
          schedule,
          location,
          regular_price,
          private_price,
          currency
        ),
        class_enrollment_schedule (
          selected_days
        )
      `)
      .eq("user_id", user.id)
      .order("enrolled_at", { ascending: false });

    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        *,
        events:event_id (
          title,
          start_time,
          venue_address,
          class_category
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from("mobile_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (enrollmentsData) setEnrollments(enrollmentsData as any);
    if (bookingsData) setBookings(bookingsData as any);
    if (paymentsData) setPayments(paymentsData);

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "paid":
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending</Badge>;
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Pending"}</Badge>;
    }
  };

  const getClassType = (enrollment: Enrollment) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return "Private";
    }
    return "Regular";
  };

  const getSchedule = (enrollment: Enrollment) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return enrollment.class_enrollment_schedule[0].selected_days.join(", ");
    }
    return enrollment.classes?.schedule || "Fixed Schedule";
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-gradient-subtle">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground mt-2">View your classes, bookings, and payment history</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{enrollments.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Event Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{bookings.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-3xl font-bold">
                    {enrollments.filter(e => e.payment_status === "pending").length +
                      bookings.filter(b => b.status === "pending").length}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  <span className="text-3xl font-bold">{payments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="classes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="classes">My Classes</TabsTrigger>
              <TabsTrigger value="bookings">Event Bookings</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="classes">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Classes</CardTitle>
                  <CardDescription>Your current class enrollments and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading...</p>
                  ) : enrollments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      You haven't enrolled in any classes yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{enrollment.classes?.title}</h3>
                              <Badge variant="outline" className="capitalize">
                                {enrollment.classes?.category}
                              </Badge>
                              <Badge variant={getClassType(enrollment) === "Private" ? "default" : "secondary"}>
                                {getClassType(enrollment)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Schedule: {getSchedule(enrollment)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Location: {enrollment.classes?.location || "TBA"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Enrolled: {format(new Date(enrollment.enrolled_at), "PPP")}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(enrollment.payment_status)}
                            <p className="text-sm font-bold text-primary mt-2">
                              {getClassType(enrollment) === "Private"
                                ? enrollment.classes?.private_price
                                : enrollment.classes?.regular_price}{" "}
                              {enrollment.classes?.currency}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Event Bookings</CardTitle>
                  <CardDescription>Your event booking history and status</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading...</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      You haven't booked any events yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{booking.events?.title}</h3>
                              <Badge variant="outline" className="capitalize">
                                {booking.events?.class_category || "Event"}
                              </Badge>
                            </div>
                            {booking.events?.start_time && (
                              <p className="text-sm text-muted-foreground">
                                Date: {format(new Date(booking.events.start_time), "PPP 'at' h:mm a")}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Location: {booking.events?.venue_address || "TBA"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Booked: {format(new Date(booking.created_at), "PPP")}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-bold text-primary mt-2">
                              {booking.amount} {booking.currency || "RWF"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Your mobile money payment records</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading...</p>
                  ) : payments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No payment records found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{payment.payment_method}</Badge>
                              {getStatusBadge(payment.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Date: {format(new Date(payment.created_at), "PPP 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {payment.amount} {payment.currency || "RWF"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;