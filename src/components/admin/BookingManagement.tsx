import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, Trash2, Download, Search } from "lucide-react";
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
    venue_address: string;
  };
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter]);

  const filterBookings = () => {
    let filtered = [...bookings];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.profiles?.first_name?.toLowerCase().includes(query) ||
        booking.profiles?.last_name?.toLowerCase().includes(query) ||
        booking.profiles?.phone?.toLowerCase().includes(query) ||
        booking.events?.title?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    setFilteredBookings(filtered);
  };

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
    
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!bookingsData || bookingsData.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(bookingsData.map(b => b.user_id))];
    const eventIds = [...new Set(bookingsData.map(b => b.event_id))];

    const [profilesRes, eventsRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, phone").in("id", userIds),
      supabase.from("events").select("id, title, start_time, venue_address").in("id", eventIds)
    ]);

    const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const eventsMap = new Map((eventsRes.data || []).map(e => [e.id, e]));

    const combinedData = bookingsData.map(booking => ({
      ...booking,
      profiles: profilesMap.get(booking.user_id) || null,
      events: eventsMap.get(booking.event_id) || null,
    }));

    setBookings(combinedData as any);
    setLoading(false);
  };

  const sendStatusChangeEmail = async (booking: BookingWithDetails, newStatus: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          type: "booking",
          userId: booking.user_id,
          itemTitle: booking.events?.title || "Event",
          itemDetails: booking.events?.start_time 
            ? `Date: ${format(new Date(booking.events.start_time), "PPP 'at' h:mm a")}${booking.events?.venue_address ? ` | Location: ${booking.events.venue_address}` : ""} | Status: ${newStatus.toUpperCase()}`
            : `Status: ${newStatus.toUpperCase()}`,
          amount: booking.amount,
          currency: "RWF",
          status: newStatus,
        },
      });

      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Status change email sent successfully");
      }
    } catch (error) {
      console.error("Error invoking email function:", error);
    }
  };

  const handleStatusChange = async (booking: BookingWithDetails, newStatus: "pending" | "confirmed" | "paid" | "canceled" | "refunded") => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", booking.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });
      
      // Send email for any status change
      sendStatusChangeEmail(booking, newStatus);
      fetchBookings();
    }
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

  const exportToCSV = () => {
    const headers = ["Full Name", "Phone", "Event", "Event Date", "Amount", "Status", "Booked On"];
    const rows = filteredBookings.map(booking => [
      `${booking.profiles?.first_name || ""} ${booking.profiles?.last_name || ""}`.trim(),
      booking.profiles?.phone || "N/A",
      booking.events?.title || "N/A",
      booking.events?.start_time ? format(new Date(booking.events.start_time), "PPP") : "N/A",
      `${booking.amount} RWF`,
      booking.status,
      format(new Date(booking.created_at), "PPP")
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast({
      title: "Export Successful",
      description: "Bookings exported to CSV",
    });
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>View and manage event bookings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
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
                      <Badge variant="outline">Mobile Money</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={booking.status}
                        onValueChange={(value: "pending" | "confirmed" | "paid" | "canceled" | "refunded") => handleStatusChange(booking, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500" />
                              Pending
                            </span>
                          </SelectItem>
                          <SelectItem value="confirmed">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Confirmed
                            </span>
                          </SelectItem>
                          <SelectItem value="paid">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Paid
                            </span>
                          </SelectItem>
                          <SelectItem value="canceled">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Canceled
                            </span>
                          </SelectItem>
                          <SelectItem value="refunded">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-gray-500" />
                              Refunded
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.created_at), "PPP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {userRole === "super_admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(booking.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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