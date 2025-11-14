import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";

export default function SampleDataManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const insertSampleClasses = async () => {
    if (!user) return;

    const sampleClasses = [
      {
        title: "Beginner Salsa",
        description: "Learn the basics of Salsa dancing with our expert instructors. Perfect for absolute beginners!",
        category: "salsa" as const,
        schedule: "Monday & Wednesday, 6:00 PM - 7:00 PM",
        price: 15000,
        capacity: 20,
        location: "Kigali Dance Studio, KG 5 Ave",
        created_by: user.id,
        is_active: true,
      },
      {
        title: "Intermediate Bachata",
        description: "Take your Bachata skills to the next level with advanced footwork and partner techniques.",
        category: "bachata" as const,
        schedule: "Tuesday & Thursday, 7:00 PM - 8:00 PM",
        price: 18000,
        capacity: 15,
        location: "Kigali Dance Studio, KG 5 Ave",
        created_by: user.id,
        is_active: true,
      },
      {
        title: "Kizomba Fundamentals",
        description: "Discover the sensual rhythms of Kizomba. Great for couples and solo dancers alike.",
        category: "kizomba" as const,
        schedule: "Friday, 8:00 PM - 9:30 PM",
        price: 20000,
        capacity: 18,
        location: "Kigali Dance Studio, KG 5 Ave",
        created_by: user.id,
        is_active: true,
      },
      {
        title: "Zouk Social Dancing",
        description: "Join our fun and energetic Zouk class for all levels. Learn to flow with the music!",
        category: "zouk" as const,
        schedule: "Saturday, 5:00 PM - 6:30 PM",
        price: 17000,
        capacity: 20,
        location: "Kigali Dance Studio, KG 5 Ave",
        created_by: user.id,
        is_active: true,
      },
      {
        title: "Konpa Dance Workshop",
        description: "Experience the vibrant rhythms of Konpa in this exciting workshop series.",
        category: "konpa" as const,
        schedule: "Sunday, 3:00 PM - 4:30 PM",
        price: 16000,
        capacity: 25,
        location: "Kigali Dance Studio, KG 5 Ave",
        created_by: user.id,
        is_active: true,
      },
    ];

    const { error } = await supabase.from("classes").insert(sampleClasses);

    if (error) {
      toast({ title: "Error", description: "Failed to add sample classes", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Sample classes added successfully" });
    }
  };

  const insertSampleEvents = async () => {
    if (!user) return;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    const sampleEvents = [
      {
        title: "Salsa Social Night",
        description: "Join us for an unforgettable night of Salsa dancing! Live music, great atmosphere, and dancers from all levels welcome.",
        start_time: nextWeek.toISOString(),
        end_time: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        venue_address: "Dance Well Studio, Kigali Heights, KN 3 Rd",
        capacity: 100,
        price: 5000,
        is_paid: true,
        class_category: "salsa" as const,
        status: "upcoming",
        created_by: user.id,
      },
      {
        title: "Bachata Bootcamp Weekend",
        description: "Intensive 2-day Bachata workshop with international instructors. All levels welcome!",
        start_time: twoWeeks.toISOString(),
        end_time: new Date(twoWeeks.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        venue_address: "Serena Hotel Conference Hall, Kigali",
        capacity: 50,
        price: 25000,
        is_paid: true,
        class_category: "bachata" as const,
        status: "upcoming",
        created_by: user.id,
      },
      {
        title: "Free Kizomba Introduction",
        description: "Come try Kizomba for free! Perfect for beginners who want to experience this beautiful dance style.",
        start_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        venue_address: "Dance Well Studio, Kigali Heights, KN 3 Rd",
        capacity: 30,
        price: 0,
        is_paid: false,
        class_category: "kizomba" as const,
        status: "upcoming",
        created_by: user.id,
      },
      {
        title: "Latin Night Extravaganza",
        description: "A spectacular night featuring Salsa, Bachata, Merengue, and more! Live DJ and performance showcases.",
        start_time: threeWeeks.toISOString(),
        end_time: new Date(threeWeeks.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        venue_address: "Kigali Marriott Hotel Grand Ballroom",
        capacity: 200,
        price: 10000,
        is_paid: true,
        class_category: "salsa" as const,
        status: "upcoming",
        created_by: user.id,
      },
    ];

    const { error } = await supabase.from("events").insert(sampleEvents);

    if (error) {
      toast({ title: "Error", description: "Failed to add sample events", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Sample events added successfully" });
    }
  };

  const insertAllSampleData = async () => {
    setLoading(true);
    await insertSampleClasses();
    await insertSampleEvents();
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Data Manager</CardTitle>
        <CardDescription>
          Quickly populate your database with sample classes and events for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button onClick={insertSampleClasses} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Add Sample Classes
          </Button>
          <Button onClick={insertSampleEvents} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Add Sample Events
          </Button>
          <Button onClick={insertAllSampleData} disabled={loading} variant="default">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Add All Sample Data
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This will create 5 sample classes and 4 sample events. You can edit or delete them later.
        </p>
      </CardContent>
    </Card>
  );
}
