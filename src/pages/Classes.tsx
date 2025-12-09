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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import MobilePayment from "@/components/MobilePayment";

const Classes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [enrollmentType, setEnrollmentType] = useState<"regular" | "private">("regular");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    } else {
      setEnrollments([]);
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

  const handleEnrollClick = (classItem: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedClass(classItem);
    setEnrollmentType("regular");
    setSelectedDays([]);
    setShowEnrollDialog(true);
  };

  const handleConfirmEnrollment = async () => {
    if (!user || !selectedClass) return;

    // Validate day selection for private classes
    if (enrollmentType === "private" && selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("class_enrollments")
      .insert({
        user_id: user.id,
        class_id: selectedClass.id,
        payment_status: "pending",
      })
      .select()
      .single();

    if (enrollError) {
      toast({
        title: "Error",
        description: enrollError.message,
        variant: "destructive",
      });
      return;
    }

    // Save schedule for private classes
    if (enrollmentType === "private" && enrollment) {
      await supabase.from("class_enrollment_schedule").insert({
        enrollment_id: enrollment.id,
        selected_days: selectedDays,
      });
    }

    setEnrollmentId(enrollment.id);
    setShowEnrollDialog(false);
    setShowPayment(true);
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

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getPrice = () => {
    if (!selectedClass) return 0;
    return enrollmentType === "regular" ? selectedClass.regular_price : selectedClass.private_price;
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
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Regular: {classItem.regular_price} {classItem.currency}</span>
                            <span>Private: {classItem.private_price} {classItem.currency}</span>
                          </div>
                          {isEnrolled ? (
                            <Button variant="outline" onClick={() => handleUnenroll(classItem.id)} className="w-full">
                              Unenroll
                            </Button>
                          ) : (
                            <Button onClick={() => handleEnrollClick(classItem)} className="w-full">
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

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enroll in {selectedClass?.title}</DialogTitle>
            <DialogDescription>
              Choose your class type and schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Class Type</label>
              <RadioGroup value={enrollmentType} onValueChange={(value: any) => setEnrollmentType(value)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="regular" id="regular" />
                  <Label htmlFor="regular" className="flex-1">
                    <div>
                      <div className="font-medium">Regular Class</div>
                      <div className="text-sm text-muted-foreground">
                        Fixed days: {selectedClass?.fixed_days?.join(", ")}
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {selectedClass?.regular_price} {selectedClass?.currency}
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1">
                    <div>
                      <div className="font-medium">Private Class</div>
                      <div className="text-sm text-muted-foreground">Choose your own days</div>
                      <div className="text-sm font-bold text-primary">
                        {selectedClass?.private_price} {selectedClass?.currency}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {enrollmentType === "private" && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Days</label>
                <div className="space-y-2">
                  {selectedClass?.available_days?.map((day: string) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={selectedDays.includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <Label htmlFor={day}>{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleConfirmEnrollment} className="w-full">
              Confirm Enrollment ({getPrice()} {selectedClass?.currency})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-[500px]">
          <MobilePayment
            amount={getPrice()}
            enrollmentId={enrollmentId || undefined}
            userId={user?.id || ""}
            onPaymentInitiated={() => {
              setShowPayment(false);
              toast({
                title: "Enrollment Pending",
                description: "Complete payment to activate your enrollment",
              });
              fetchEnrollments();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
