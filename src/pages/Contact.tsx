import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission will be implemented with backend
    console.log("Form submitted");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16 md:py-20 text-white">
          <div className="container">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4 md:text-5xl">Get in Touch</h1>
              <p className="text-lg text-white/90">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contact Form */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you shortly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+250 788 123 456" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us how we can help you..."
                        rows={5}
                        required
                      />
                    </div>
                    
                    <Button type="submit" variant="hero" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Email</CardTitle>
                    <CardDescription>
                      Send us an email anytime
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href="mailto:well.dance.classic@gmail.com"
                      className="text-primary hover:underline font-medium"
                    >
                      well.dance.classic@gmail.com
                    </a>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                      <Phone className="h-6 w-6 text-secondary" />
                    </div>
                    <CardTitle>Phone</CardTitle>
                    <CardDescription>
                      Call us during business hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a 
                      href="tel:+250788630520"
                      className="block text-primary hover:underline font-medium"
                    >
                      +250 788 630 520
                    </a>
                    <a 
                      href="tel:+250787977557"
                      className="block text-primary hover:underline font-medium"
                    >
                      +250 787 977 557
                    </a>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <CardTitle>Visit Us</CardTitle>
                    <CardDescription>
                      Come visit our dance studios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Kigali, Rwanda
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Monday - Friday: 3:00 PM - 10:00 PM<br />
                      Saturday - Sunday: 10:00 AM - 8:00 PM
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
