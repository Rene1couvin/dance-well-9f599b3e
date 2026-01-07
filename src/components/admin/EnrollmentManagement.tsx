import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Printer, Trash2, Download, Search } from "lucide-react";
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
    schedule: string;
    location: string;
  };
  class_enrollment_schedule?: {
    selected_days: string[];
  }[];
}

export default function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRole();
    fetchEnrollments();
  }, []);

  useEffect(() => {
    filterEnrollments();
  }, [enrollments, searchQuery, statusFilter, categoryFilter]);

  const filterEnrollments = () => {
    let filtered = [...enrollments];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(enrollment => 
        enrollment.profiles?.first_name?.toLowerCase().includes(query) ||
        enrollment.profiles?.last_name?.toLowerCase().includes(query) ||
        enrollment.profiles?.phone?.toLowerCase().includes(query) ||
        enrollment.profiles?.username?.toLowerCase().includes(query) ||
        enrollment.classes?.title?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(enrollment => (enrollment.payment_status || "pending") === statusFilter);
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(enrollment => enrollment.classes?.category === categoryFilter);
    }
    
    setFilteredEnrollments(filtered);
  };

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
    
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from("class_enrollments")
      .select("*")
      .order("enrolled_at", { ascending: false });

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      toast({
        title: "Error",
        description: "Failed to load class enrollments",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!enrollmentsData || enrollmentsData.length === 0) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(enrollmentsData.map(e => e.user_id))];
    const classIds = [...new Set(enrollmentsData.map(e => e.class_id))];
    const enrollmentIds = enrollmentsData.map(e => e.id);

    const [profilesRes, classesRes, schedulesRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, phone, username").in("id", userIds),
      supabase.from("classes").select("id, title, category, regular_price, private_price, class_type, schedule, location").in("id", classIds),
      supabase.from("class_enrollment_schedule").select("enrollment_id, selected_days").in("enrollment_id", enrollmentIds)
    ]);

    const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const classesMap = new Map((classesRes.data || []).map(c => [c.id, c]));
    
    const schedulesMap = new Map<string, { selected_days: string[] }[]>();
    (schedulesRes.data || []).forEach(s => {
      const existing = schedulesMap.get(s.enrollment_id) || [];
      existing.push({ selected_days: s.selected_days });
      schedulesMap.set(s.enrollment_id, existing);
    });

    const combinedData = enrollmentsData.map(enrollment => ({
      ...enrollment,
      profiles: profilesMap.get(enrollment.user_id) || null,
      classes: classesMap.get(enrollment.class_id) || null,
      class_enrollment_schedule: schedulesMap.get(enrollment.id) || [],
    }));

    setEnrollments(combinedData as any);
    setLoading(false);
  };

  const getClassType = (enrollment: EnrollmentWithDetails) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return "Private";
    }
    return "Regular";
  };

  const getSchedule = (enrollment: EnrollmentWithDetails) => {
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return enrollment.class_enrollment_schedule[0].selected_days.join(", ");
    }
    return "Fixed Schedule";
  };

  const getPrice = (enrollment: EnrollmentWithDetails) => {
    const classData = enrollment.classes;
    if (!classData) return 0;
    
    if (enrollment.class_enrollment_schedule && enrollment.class_enrollment_schedule.length > 0) {
      return classData.private_price || 0;
    }
    return classData.regular_price || 0;
  };

  const sendStatusChangeEmail = async (enrollment: EnrollmentWithDetails, newStatus: string) => {
    try {
      const classType = getClassType(enrollment);
      const schedule = getSchedule(enrollment);
      const price = getPrice(enrollment);

      const { error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          type: "enrollment",
          userId: enrollment.user_id,
          itemTitle: enrollment.classes?.title || "Class",
          itemDetails: `Type: ${classType} | Schedule: ${schedule}${enrollment.classes?.location ? ` | Location: ${enrollment.classes.location}` : ""} | Status: ${newStatus.toUpperCase()}`,
          amount: price,
          currency: "RWF",
          status: newStatus,
        },
      });

      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Status change email sent successfully");
      }
    } catch (error) {
      console.error("Error invoking email function:", error);
    }
  };

  const handleStatusChange = async (enrollment: EnrollmentWithDetails, newStatus: string) => {
    const { error } = await supabase
      .from("class_enrollments")
      .update({ payment_status: newStatus })
      .eq("id", enrollment.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update enrollment status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Enrollment status updated to ${newStatus}`,
      });
      
      // Send email for any status change
      sendStatusChangeEmail(enrollment, newStatus);
      fetchEnrollments();
    }
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

  const exportToCSV = () => {
    const headers = ["Student Name", "Email", "Phone", "Class", "Category", "Type", "Schedule", "Price", "Status", "Enrolled On"];
    const rows = filteredEnrollments.map(enrollment => [
      `${enrollment.profiles?.first_name || ""} ${enrollment.profiles?.last_name || ""}`.trim(),
      enrollment.profiles?.username || "N/A",
      enrollment.profiles?.phone || "N/A",
      enrollment.classes?.title || "N/A",
      enrollment.classes?.category || "N/A",
      getClassType(enrollment),
      getSchedule(enrollment),
      `${getPrice(enrollment)} RWF`,
      enrollment.payment_status || "pending",
      format(new Date(enrollment.enrolled_at), "PPP")
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enrollments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast({
      title: "Export Successful",
      description: "Enrollments exported to CSV",
    });
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

  // Get unique categories for filter
  const categories = [...new Set(enrollments.map(e => e.classes?.category).filter(Boolean))];

  if (loading) {
    return <div>Loading enrollments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Class Enrollment Management</CardTitle>
            <CardDescription>View and manage class enrollments</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center">
                    No enrollments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                    </TableCell>
                    <TableCell>{enrollment.profiles?.username}</TableCell>
                    <TableCell>{enrollment.profiles?.phone || "N/A"}</TableCell>
                    <TableCell>{enrollment.classes?.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {enrollment.classes?.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getClassType(enrollment) === "Private" ? "default" : "secondary"}>
                        {getClassType(enrollment)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getSchedule(enrollment)}</TableCell>
                    <TableCell>{getPrice(enrollment)} RWF</TableCell>
                    <TableCell>
                      <Badge variant="outline">Mobile Money</Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={enrollment.payment_status || "pending"}
                        onValueChange={(value) => handleStatusChange(enrollment, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500" />
                              Pending
                            </span>
                          </SelectItem>
                          <SelectItem value="confirmed">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Confirmed
                            </span>
                          </SelectItem>
                          <SelectItem value="paid">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Paid
                            </span>
                          </SelectItem>
                          <SelectItem value="canceled">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Canceled
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {userRole === "super_admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(enrollment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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