import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

const ContactInbox = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contact messages:", error);
      toast({
        title: "Error",
        description: "Failed to load contact messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ 
        status: "read",
        responded_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Message marked as read",
      });
      fetchMessages();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Messages</h2>
        <p className="text-muted-foreground">
          View and manage messages submitted through the contact form
        </p>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No contact messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {msg.name}
                      <Badge variant={msg.status === "unread" ? "default" : "secondary"}>
                        {msg.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${msg.email}`} className="hover:underline">
                          {msg.email}
                        </a>
                      </div>
                      {msg.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${msg.phone}`} className="hover:underline">
                            {msg.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(msg.created_at), "PPpp")}
                      </div>
                    </CardDescription>
                  </div>
                  {msg.status === "unread" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(msg.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactInbox;
