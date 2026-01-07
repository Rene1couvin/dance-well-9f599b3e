import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Music, Award, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-dance.jpg";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  start_time: string;
  venue_address: string | null;
  price: number | null;
  is_paid: boolean;
  class_category: string | null;
}

interface Class {
  id: string;
  title: string;
  category: string;
  schedule: string | null;
  location: string | null;
  regular_price: number | null;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviewData();
  }, []);

  const fetchPreviewData = async () => {
    // Fetch upcoming events (next 3)
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, start_time, venue_address, price, is_paid, class_category")
      .gte("start_time", new Date().toISOString())
      .eq("status", "upcoming")
      .order("start_time", { ascending: true })
      .limit(3);

    // Fetch active classes (first 4)
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, title, category, schedule, location, regular_price")
      .eq("is_active", true)
      .limit(4);

    setUpcomingEvents(eventsData || []);
    setClasses(classesData || []);
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/classes");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-hero" />
          </div>
          
          <div className="container relative py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center text-white">
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Feel the Rhythm,
                <span className="block text-accent"> Move with Passion</span>
              </h1>
              <p className="mb-8 text-lg text-white/90 md:text-xl">
                Join Dance Well for world-class instruction in Salsa, Bachata, Kizomba, and more. 
                From beginners to advanced dancers, we have the perfect class for you.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button variant="hero" size="lg" asChild className="shadow-elegant">
                  <Link to="/classes">Browse Classes</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Link to="/events">Upcoming Events</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events Preview Section */}
        {upcomingEvents.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2 md:text-4xl">Upcoming Events</h2>
                  <p className="text-muted-foreground">Don't miss out on our exciting dance events</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/events" className="flex items-center gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="border-2 hover:shadow-elegant transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {event.class_category || "Dance"}
                        </Badge>
                        <Badge className={event.is_paid ? "bg-primary" : "bg-green-500"}>
                          {event.is_paid ? `${event.price} RWF` : "Free"}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.start_time), "PPP")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.start_time), "h:mm a")}
                      </div>
                      {event.venue_address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.venue_address}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Classes Preview Section */}
        {classes.length > 0 && (
          <section className="py-16 md:py-24">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2 md:text-4xl">Our Classes</h2>
                  <p className="text-muted-foreground">Learn from expert instructors in various dance styles</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/classes" className="flex items-center gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border-2 hover:shadow-elegant transition-all duration-300">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit capitalize mb-2">
                        {cls.category}
                      </Badge>
                      <CardTitle className="text-lg line-clamp-2">{cls.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {cls.schedule && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {cls.schedule}
                        </div>
                      )}
                      {cls.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {cls.location}
                        </div>
                      )}
                      <div className="pt-2">
                        <span className="text-primary font-semibold">
                          {cls.regular_price ? `${cls.regular_price} RWF` : "Contact for price"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className={`py-16 md:py-24 ${upcomingEvents.length === 0 && classes.length === 0 ? 'bg-muted/30' : ''}`}>
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">Why Dance With Us?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Experience the perfect blend of professional instruction, vibrant community, and unforgettable events.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-2 hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Multiple Styles</CardTitle>
                  <CardDescription>
                    Learn Salsa, Bachata, Kizomba, Semba, Konpa, Zouk, and more from expert instructors.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Vibrant Community</CardTitle>
                  <CardDescription>
                    Join a welcoming community of dancers at all skill levels who share your passion.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Regular Events</CardTitle>
                  <CardDescription>
                    Enjoy social dances, workshops, and performances throughout the year.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Expert Instructors</CardTitle>
                  <CardDescription>
                    Learn from experienced teachers dedicated to helping you grow as a dancer.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Calendar Preview */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 md:text-4xl">View Our Calendar</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Check out our full schedule of classes and events
              </p>
            </div>
            <div className="flex justify-center">
              <Button size="lg" asChild>
                <Link to="/calendar" className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Open Calendar
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <Card className="border-2 bg-gradient-primary text-primary-foreground shadow-elegant">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-3xl font-bold mb-4 md:text-4xl">Ready to Start Your Dance Journey?</h2>
                <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                  Join Dance Well today and discover the joy of movement. Sign up for your first class and become part of our vibrant dance family.
                </p>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleGetStarted}
                  className="bg-white text-primary hover:bg-white/90 border-0"
                >
                  Get Started Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
