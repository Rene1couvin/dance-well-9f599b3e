import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const Classes = () => {
  const classes = [
    {
      id: 1,
      title: "Salsa Fundamentals",
      category: "Salsa",
      level: "Beginner",
      instructor: "Maria Rodriguez",
      schedule: "Mondays & Wednesdays",
      time: "7:00 PM - 8:30 PM",
      location: "Studio A",
      price: "Free",
      capacity: 20,
      enrolled: 12,
    },
    {
      id: 2,
      title: "Bachata Sensual",
      category: "Bachata",
      level: "Intermediate",
      instructor: "Carlos Santos",
      schedule: "Tuesdays & Thursdays",
      time: "8:00 PM - 9:30 PM",
      location: "Studio B",
      price: "$40/month",
      capacity: 16,
      enrolled: 14,
    },
    {
      id: 3,
      title: "Kizomba Basics",
      category: "Kizomba",
      level: "Beginner",
      instructor: "Ana Silva",
      schedule: "Wednesdays",
      time: "6:00 PM - 7:30 PM",
      location: "Studio A",
      price: "$30/month",
      capacity: 18,
      enrolled: 8,
    },
    {
      id: 4,
      title: "Advanced Salsa Styling",
      category: "Salsa",
      level: "Advanced",
      instructor: "Luis Martinez",
      schedule: "Fridays",
      time: "7:30 PM - 9:00 PM",
      location: "Studio B",
      price: "$50/month",
      capacity: 12,
      enrolled: 10,
    },
    {
      id: 5,
      title: "Zouk Flow",
      category: "Zouk",
      level: "Intermediate",
      instructor: "Patricia Costa",
      schedule: "Saturdays",
      time: "5:00 PM - 6:30 PM",
      location: "Studio A",
      price: "$35/month",
      capacity: 15,
      enrolled: 9,
    },
    {
      id: 6,
      title: "Semba Workshop",
      category: "Semba",
      level: "All Levels",
      instructor: "João Ferreira",
      schedule: "Sundays",
      time: "3:00 PM - 5:00 PM",
      location: "Studio B",
      price: "$25/session",
      capacity: 20,
      enrolled: 15,
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-secondary text-secondary-foreground";
      case "Intermediate":
        return "bg-accent text-accent-foreground";
      case "Advanced":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16 md:py-20 text-white">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4 md:text-5xl">Our Classes</h1>
              <p className="text-lg text-white/90">
                Choose from a variety of dance styles and skill levels. Whether you're just starting or looking to refine your technique, we have the perfect class for you.
              </p>
            </div>
          </div>
        </section>

        {/* Classes Grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="flex flex-col hover:shadow-elegant transition-all duration-300 border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{classItem.category}</Badge>
                      <Badge className={getLevelColor(classItem.level)}>{classItem.level}</Badge>
                    </div>
                    <CardTitle className="text-xl">{classItem.title}</CardTitle>
                    <CardDescription>with {classItem.instructor}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{classItem.enrolled} / {classItem.capacity} enrolled</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-2xl font-bold text-primary">{classItem.price}</p>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      variant="hero" 
                      className="w-full"
                      disabled={classItem.enrolled >= classItem.capacity}
                    >
                      {classItem.enrolled >= classItem.capacity ? "Class Full" : "Enroll Now"}
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

export default Classes;
