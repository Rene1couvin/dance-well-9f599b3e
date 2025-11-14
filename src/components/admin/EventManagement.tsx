import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  venue_address: string;
  online_link: string;
  capacity: number;
  price: number;
  is_paid: boolean;
  class_category: string;
  status: string;
}

export default function EventManagement() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    venue_address: string;
    online_link: string;
    capacity: number;
    price: number;
    is_paid: boolean;
    class_category: "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk";
    status: string;
  }>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    venue_address: "",
    online_link: "",
    capacity: 50,
    price: 0,
    is_paid: false,
    class_category: "salsa",
    status: "upcoming",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("start_time", { ascending: false });
    if (data) setEvents(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const eventData = {
      ...formData,
      created_by: user.id,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Event updated successfully" });
        resetForm();
        fetchEvents();
      }
    } else {
      const { error } = await supabase.from("events").insert(eventData);

      if (error) {
        toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Event created successfully" });
        resetForm();
        fetchEvents();
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      start_time: event.start_time?.slice(0, 16) || "",
      end_time: event.end_time?.slice(0, 16) || "",
      venue_address: event.venue_address || "",
      online_link: event.online_link || "",
      capacity: event.capacity,
      price: event.price || 0,
      is_paid: event.is_paid || false,
      class_category: event.class_category as "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk",
      status: event.status || "upcoming",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Event deleted successfully" });
      fetchEvents();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      venue_address: "",
      online_link: "",
      capacity: 50,
      price: 0,
      is_paid: false,
      class_category: "salsa",
      status: "upcoming",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>Create and manage dance events</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Add Event"}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <Input
                placeholder="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <Input
                placeholder="Venue Address"
                value={formData.venue_address}
                onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              />
              <Input
                placeholder="Online Link (optional)"
                value={formData.online_link}
                onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
              />
              <Select
                value={formData.class_category}
                onValueChange={(value) => setFormData({ ...formData, class_category: value as "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salsa">Salsa</SelectItem>
                  <SelectItem value="bachata">Bachata</SelectItem>
                  <SelectItem value="kizomba">Kizomba</SelectItem>
                  <SelectItem value="konpa">Konpa</SelectItem>
                  <SelectItem value="semba">Semba</SelectItem>
                  <SelectItem value="zouk">Zouk</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Price (RWF)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  disabled={!formData.is_paid}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_paid"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                />
                <Label htmlFor="is_paid">Paid Event</Label>
              </div>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="submit">{editingEvent ? "Update" : "Create"} Event</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.start_time).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{event.class_category}</Badge>
                  </TableCell>
                  <TableCell>{event.is_paid ? `${event.price} RWF` : "Free"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.status === "upcoming"
                          ? "default"
                          : event.status === "completed"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
