import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentWithDetails {
  id: string;
  user_id: string;
  class_id: string;
  enrolled_at: string;
  payment_status: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    username: string;
  };
  classes: {
    title: string;
    category: string;
    regular_price: number;
    private_price: number;
    class_type: string;
  };
  class_enrollment_schedule?: {
    selected_days: string[];
  }[];
}

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchEnrollments();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("class_enrollments")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          phone,
          username
        ),
        classes:class_id (
          title,
          category,
          regular_price,
          private_price,
          class_type
        ),
        class_enrollment_schedule (
          selected_days
        )
      `)
      .order("enrolled_at", { ascending: false });

    if (error) {
      console.error("Error fetching enrollments:", error);
      toast({
        title: "Error",
        description: "Failed to load class enrollments",
        variant: "destructive",
      });
    } else if (data) {
      setEnrollments(data as any);
    }

    setLoading(false);
  };

  const handleDelete = async (enrollmentId: string) => {
    if (userRole !== "super_admin") {
      toast({
        title: "Permission Denied",
        description: "Only super admins can remove enrollments",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to remove this enrollment?")) return;

    const { error } = await supabase
      .from("class_enrollments")
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove enrollment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Enrollment removed successfully",
      });
      fetchEnrollments();
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("enrollments-table");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Class Enrollments Report - ${format(new Date(), "PPP")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ff6b35; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #ff6b35; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-paid { background-color: #d1fae5; color: #065f46; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dance Well - Class Enrollments Report</h1>
            <p>Generated: ${format(new Date(), "PPP p")}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const getPrice = (enrollment: EnrollmentWithDetails) => {
    const classData = enrollment.classes;
    if (!classData) return "N/A";
    
    // If private class (has custom schedule), use private price
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return `${classData.private_price || 0} RWF`;
    }
    // Otherwise use regular price
    return `${classData.regular_price || 0} RWF`;
  };

  const getSchedule = (enrollment: EnrollmentWithDetails) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return enrollment.class_enrollment_schedule[0].selected_days.join(", ");
    }
    return "Fixed Schedule";
  };

  const getClassType = (enrollment: EnrollmentWithDetails) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return "Private";
    }
    return "Regular";
  };

  if (loading) {
    return <div>Loading enrollments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Class Enrollment Management</CardTitle>
            <CardDescription>View and manage class enrollments</CardDescription>
          </div>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="enrollments-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Enrolled On</TableHead>
                {userRole === "super_admin" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === "super_admin" ? 11 : 10} className="text-center">
                    No enrollments found
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                    </TableCell>
                    <TableCell>{enrollment.profiles?.username}</TableCell>
                    <TableCell>{enrollment.profiles?.phone || "N/A"}</TableCell>
                    <TableCell>{enrollment.classes?.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {enrollment.classes?.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getClassType(enrollment) === "Private" ? "default" : "secondary"}>
                        {getClassType(enrollment)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getSchedule(enrollment)}</TableCell>
                    <TableCell>{getPrice(enrollment)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          enrollment.payment_status === "paid"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {enrollment.payment_status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(enrollment.enrolled_at), "PPP")}
                    </TableCell>
                    {userRole === "super_admin" && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(enrollment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
