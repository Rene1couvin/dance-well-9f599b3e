import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ArchivedEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  venue_address: string;
  capacity: number;
  price: number;
  is_paid: boolean;
  class_category: string;
  status: string;
  bookings_count?: number;
}

export default function ArchivedEvents() {
  const [events, setEvents] = useState<ArchivedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchArchivedEvents();
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

  const fetchArchivedEvents = async () => {
    setLoading(true);
    
    // Fetch events that have ended (start_time is in the past)
    const { data: eventsData, error } = await supabase
      .from("events")
      .select("*")
      .lt("start_time", new Date().toISOString())
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching archived events:", error);
      toast({
        title: "Error",
        description: "Failed to load archived events",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!eventsData || eventsData.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Fetch booking counts for each event
    const eventIds = eventsData.map(e => e.id);
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("event_id")
      .in("event_id", eventIds);

    // Count bookings per event
    const bookingsCountMap = new Map<string, number>();
    (bookingsData || []).forEach(b => {
      const count = bookingsCountMap.get(b.event_id) || 0;
      bookingsCountMap.set(b.event_id, count + 1);
    });

    // Combine data
    const enrichedEvents = eventsData.map(event => ({
      ...event,
      bookings_count: bookingsCountMap.get(event.id) || 0,
    }));

    setEvents(enrichedEvents);
    setLoading(false);
  };

  const handleReactivate = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .update({ status: "upcoming" })
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate event",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Event reactivated (note: date may still be in the past)",
      });
      fetchArchivedEvents();
    }
  };

  const handleDelete = async (eventId: string) => {
    if (userRole !== "super_admin") {
      toast({
        title: "Permission Denied",
        description: "Only super admins can delete archived events",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Event deleted permanently",
      });
      fetchArchivedEvents();
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("archived-events-table");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Archived Events Report - ${format(new Date(), "PPP")}</title>
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
            <h1>Dance Well - Archived Events Report</h1>
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
    return <div>Loading archived events...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Archived Events</CardTitle>
            <CardDescription>Past events that are no longer visible to users</CardDescription>
          </div>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="archived-events-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No archived events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {format(new Date(event.start_time), "PPP")}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.start_time), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>{event.venue_address || "Online"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.class_category}</Badge>
                    </TableCell>
                    <TableCell>
                      {event.is_paid ? `${event.price} RWF` : "Free"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{event.bookings_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Archived</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivate(event.id)}
                          title="Reactivate Event"
                        >
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                        </Button>
                        {userRole === "super_admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            title="Delete Permanently"
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