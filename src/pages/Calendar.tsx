import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start_time?: string;
  schedule?: string;
  category?: string;
  class_category?: string;
  type: "event" | "class";
  venue_address?: string;
  location?: string;
  price?: number;
  currency?: string;
}

const Calendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<CalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const categories = ["salsa", "bachata", "kizomba", "konpa", "semba", "zouk"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, start_time, class_category, venue_address, price, currency")
      .eq("status", "upcoming")
      .gte("start_time", new Date().toISOString());

    // Fetch classes
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, title, schedule, category, location, regular_price, currency")
      .eq("is_active", true);

    if (eventsData) {
      setEvents(eventsData.map(e => ({
        ...e,
        type: "event" as const,
        category: e.class_category
      })));
    }

    if (classesData) {
      setClasses(classesData.map(c => ({
        ...c,
        type: "class" as const,
        price: c.regular_price
      })));
    }

    setLoading(false);
  };

  const filteredItems = [...events, ...classes].filter(item => {
    const categoryMatch = selectedCategory === "all" || 
      item.category === selectedCategory || 
      item.class_category === selectedCategory;
    const typeMatch = selectedType === "all" || item.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (!event.start_time) return false;
      return isSameDay(new Date(event.start_time), day);
    }).filter(event => {
      const categoryMatch = selectedCategory === "all" || event.category === selectedCategory;
      const typeMatch = selectedType === "all" || selectedType === "event";
      return categoryMatch && typeMatch;
    });
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      salsa: "bg-red-500",
      bachata: "bg-pink-500",
      kizomba: "bg-purple-500",
      konpa: "bg-blue-500",
      semba: "bg-green-500",
      zouk: "bg-yellow-500",
    };
    return colors[category || ""] || "bg-primary";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-gradient-subtle">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold">Calendar</h1>
              <p className="text-muted-foreground mt-2">View all upcoming classes and events</p>
            </div>
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="class">Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-muted/30 rounded" />
                ))}
                {daysInMonth.map(day => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-24 border rounded p-1 overflow-hidden ${
                        isToday(day) ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-primary" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded text-white truncate ${getCategoryColor(event.category)}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* List View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p>Loading...</p>
                ) : filteredItems.filter(i => i.type === "event").length === 0 ? (
                  <p className="text-muted-foreground">No upcoming events</p>
                ) : (
                  filteredItems.filter(i => i.type === "event").slice(0, 5).map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-full min-h-[60px] rounded ${getCategoryColor(event.category)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">{event.category || "Event"}</Badge>
                        </div>
                        <h3 className="font-medium">{event.title}</h3>
                        {event.start_time && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                        {event.venue_address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue_address}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">
                          {event.price ? `${event.price} ${event.currency}` : "Free"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Regular Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p>Loading...</p>
                ) : filteredItems.filter(i => i.type === "class").length === 0 ? (
                  <p className="text-muted-foreground">No classes available</p>
                ) : (
                  filteredItems.filter(i => i.type === "class").slice(0, 5).map(classItem => (
                    <div key={classItem.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-full min-h-[60px] rounded ${getCategoryColor(classItem.category)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">{classItem.category}</Badge>
                        </div>
                        <h3 className="font-medium">{classItem.title}</h3>
                        {classItem.schedule && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {classItem.schedule}
                          </p>
                        )}
                        {classItem.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {classItem.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">
                          {classItem.price ? `${classItem.price} ${classItem.currency}` : "Free"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Calendar;