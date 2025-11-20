import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface BookingWithDetails {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  amount: number;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  events: {
    title: string;
    start_time: string;
  };
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchBookings();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          phone
        ),
        events:event_id (
          title,
          start_time
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } else if (data) {
      setBookings(data as any);
    }

    setLoading(false);
  };

  const handleDelete = async (bookingId: string) => {
    if (userRole !== "super_admin") {
      toast({
        title: "Permission Denied",
        description: "Only super admins can remove bookings",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to remove this booking?")) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove booking",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Booking removed successfully",
      });
      fetchBookings();
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("bookings-table");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bookings Report - ${format(new Date(), "PPP")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ff6b35; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #ff6b35; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-paid { background-color: #d1fae5; color: #065f46; }
            .badge-confirmed { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dance Well - Bookings Report</h1>
            <p>Generated: ${format(new Date(), "PPP p")}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div>Loading bookings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>View and manage event bookings</CardDescription>
          </div>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="bookings-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked On</TableHead>
                {userRole === "super_admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === "super_admin" ? 8 : 7} className="text-center">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {booking.profiles?.first_name} {booking.profiles?.last_name}
                    </TableCell>
                    <TableCell>{booking.profiles?.phone || "N/A"}</TableCell>
                    <TableCell>{booking.events?.title}</TableCell>
                    <TableCell>
                      {booking.events?.start_time 
                        ? format(new Date(booking.events.start_time), "PPP")
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell>{booking.amount} RWF</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          booking.status === "paid" || booking.status === "confirmed"
                            ? "default"
                            : booking.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.created_at), "PPP")}
                    </TableCell>
                    {userRole === "super_admin" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(booking.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
