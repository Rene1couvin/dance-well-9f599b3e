import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select(`
        *,
        profiles:teacher_id(first_name, last_name)
      `)
      .eq("is_active", true);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
      return;
    }

    setClasses(data || []);
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("user_id", user.id);

    if (data) {
      setEnrollments(data.map((e) => e.class_id));
    }
  };

  const handleEnroll = async (classId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("class_enrollments")
      .insert({ user_id: user.id, class_id: classId });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "You've enrolled in the class!",
    });

    fetchEnrollments();
  };

  const handleUnenroll = async (classId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("class_enrollments")
      .delete()
      .eq("user_id", user.id)
      .eq("class_id", classId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "You've unenrolled from the class",
    });

    fetchEnrollments();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 bg-gradient-subtle">
          <div className="container">
            <h1 className="text-5xl font-bold mb-6 text-center">Our Classes</h1>
            <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Choose from our variety of dance classes. All skill levels welcome!
            </p>

            {loading ? (
              <p className="text-center">Loading classes...</p>
            ) : classes.length === 0 ? (
              <p className="text-center text-muted-foreground">No classes available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => {
                  const isEnrolled = enrollments.includes(classItem.id);
                  
                  return (
                    <Card key={classItem.id} className="hover:shadow-elegant transition-all">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">{classItem.category}</Badge>
                        </div>
                        <CardTitle>{classItem.title}</CardTitle>
                        <CardDescription>{classItem.description}</CardDescription>
                        {classItem.profiles && (
                          <p className="text-sm text-muted-foreground">
                            Teacher: {classItem.profiles.first_name} {classItem.profiles.last_name}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Schedule</p>
                          <p className="text-sm text-muted-foreground">{classItem.schedule || "TBA"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{classItem.location || "TBA"}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">
                            {classItem.price > 0 ? `${classItem.price} ${classItem.currency}` : "Free"}
                          </span>
                          {isEnrolled ? (
                            <Button variant="outline" onClick={() => handleUnenroll(classItem.id)}>
                              Unenroll
                            </Button>
                          ) : (
                            <Button onClick={() => handleEnroll(classItem.id)}>
                              Enroll Now
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Classes;
