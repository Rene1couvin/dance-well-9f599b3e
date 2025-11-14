import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Music, Award } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dance.jpg";

const Index = () => {
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

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/30">
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
                  asChild
                  className="bg-white text-primary hover:bg-white/90 border-0"
                >
                  <Link to="/auth">Get Started Now</Link>
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
