import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, DollarSign } from "lucide-react";

const Events = () => {
  const events = [
    {
      id: 1,
      title: "Latin Night Social Dance",
      description: "Join us for an evening of social dancing with live DJ playing the best Latin hits.",
      date: "2025-12-15",
      time: "8:00 PM - 12:00 AM",
      location: "Main Dance Hall",
      price: "$15",
      category: "Social Dance",
      spotsLeft: 45,
    },
    {
      id: 2,
      title: "Bachata Styling Workshop",
      description: "Learn advanced styling techniques with international instructor Elena Torres.",
      date: "2025-12-20",
      time: "2:00 PM - 5:00 PM",
      location: "Studio A & B",
      price: "$50",
      category: "Workshop",
      spotsLeft: 8,
    },
    {
      id: 3,
      title: "New Year's Dance Party",
      description: "Ring in the new year with an epic dance celebration featuring multiple DJs and performances.",
      date: "2025-12-31",
      time: "9:00 PM - 2:00 AM",
      location: "Grand Ballroom",
      price: "$40",
      category: "Party",
      spotsLeft: 120,
    },
    {
      id: 4,
      title: "Kizomba Festival Weekend",
      description: "Three days of workshops, socials, and performances with renowned Kizomba instructors.",
      date: "2026-01-10",
      time: "All Day",
      location: "Dance Well Studios",
      price: "$180",
      category: "Festival",
      spotsLeft: 25,
    },
    {
      id: 5,
      title: "Salsa Performance Showcase",
      description: "Watch our talented students perform choreographed routines. Free entry!",
      date: "2026-01-18",
      time: "7:00 PM - 9:00 PM",
      location: "Main Theater",
      price: "Free",
      category: "Performance",
      spotsLeft: 200,
    },
    {
      id: 6,
      title: "Beginner's Social Night",
      description: "A friendly social dance event designed specifically for beginners and newcomers.",
      date: "2026-01-25",
      time: "7:00 PM - 10:00 PM",
      location: "Studio A",
      price: "$10",
      category: "Social Dance",
      spotsLeft: 30,
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16 md:py-20 text-white">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4 md:text-5xl">Upcoming Events</h1>
              <p className="text-lg text-white/90">
                Don't miss out on our exciting dance events, workshops, and social nights. Book your spot today!
              </p>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="flex flex-col hover:shadow-elegant transition-all duration-300 border-2">
                  <CardHeader>
                    <div className="mb-2">
                      <Badge variant="secondary">{event.category}</Badge>
                    </div>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-lg font-bold text-primary">{event.price}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        {event.spotsLeft} spots remaining
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      variant="hero" 
                      className="w-full"
                      disabled={event.spotsLeft === 0}
                    >
                      {event.spotsLeft === 0 ? "Sold Out" : "Book Now"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
