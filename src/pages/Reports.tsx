import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState<string>("users");
  const [reportData, setReportData] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      let data = [];
      
      switch (category) {
        case "users":
          const { data: users } = await supabase
            .from("profiles")
            .select("*")
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false });
          data = users || [];
          break;

        case "messages":
          const { data: messages } = await supabase
            .from("contact_messages")
            .select("*")
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false });
          data = messages || [];
          break;

        case "bookings":
          const { data: bookings } = await supabase
            .from("bookings")
            .select(`
              *,
              profiles:user_id (first_name, last_name),
              events:event_id (title)
            `)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false });
          data = bookings || [];
          break;

        case "classes":
          const { data: classes } = await supabase
            .from("classes")
            .select("*")
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false });
          data = classes || [];
          break;
      }

      setReportData(data);
      setShowResults(true);
      
      toast({
        title: "Success",
        description: `Found ${data.length} ${category} in the selected date range`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(255, 107, 53);
    doc.text("Dance Well - Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`, 14, 30);
    doc.text(`Date Range: ${format(new Date(startDate), "PPP")} - ${format(new Date(endDate), "PPP")}`, 14, 36);
    doc.text(`Generated: ${format(new Date(), "PPP p")}`, 14, 42);
    doc.text(`Total Records: ${reportData.length}`, 14, 48);

    // Prepare table data based on category
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (category) {
      case "users":
        headers = ["Name", "Username", "Phone", "Created"];
        rows = reportData.map(item => [
          `${item.first_name} ${item.last_name}`,
          item.username,
          item.phone || "N/A",
          format(new Date(item.created_at), "PP")
        ]);
        break;

      case "messages":
        headers = ["Name", "Email", "Status", "Date"];
        rows = reportData.map(item => [
          item.name,
          item.email,
          item.status,
          format(new Date(item.created_at), "PP")
        ]);
        break;

      case "bookings":
        headers = ["User", "Event", "Amount", "Status", "Date"];
        rows = reportData.map(item => [
          `${item.profiles?.first_name} ${item.profiles?.last_name}`,
          item.events?.title || "N/A",
          `${item.amount} RWF`,
          item.status,
          format(new Date(item.created_at), "PP")
        ]);
        break;

      case "classes":
        headers = ["Title", "Category", "Capacity", "Price", "Created"];
        rows = reportData.map(item => [
          item.title,
          item.category,
          item.capacity.toString(),
          `${item.price} RWF`,
          format(new Date(item.created_at), "PP")
        ]);
        break;
    }

    // Add table
    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [255, 107, 53] },
    });

    // Save PDF
    doc.save(`dance-well-${category}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    });
  };

  const renderTableHeaders = () => {
    switch (category) {
      case "users":
        return (
          <>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Created</TableHead>
          </>
        );
      case "messages":
        return (
          <>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </>
        );
      case "bookings":
        return (
          <>
            <TableHead>User</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </>
        );
      case "classes":
        return (
          <>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Created</TableHead>
          </>
        );
    }
  };

  const renderTableRows = () => {
    if (reportData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center">
            No data found for the selected criteria
          </TableCell>
        </TableRow>
      );
    }

    return reportData.map((item, index) => (
      <TableRow key={index}>
        {category === "users" && (
          <>
            <TableCell>{item.first_name} {item.last_name}</TableCell>
            <TableCell>{item.username}</TableCell>
            <TableCell>{item.phone || "N/A"}</TableCell>
            <TableCell>{format(new Date(item.created_at), "PPP")}</TableCell>
          </>
        )}
        {category === "messages" && (
          <>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell className="max-w-xs truncate">{item.message}</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{format(new Date(item.created_at), "PPP")}</TableCell>
          </>
        )}
        {category === "bookings" && (
          <>
            <TableCell>
              {item.profiles?.first_name} {item.profiles?.last_name}
            </TableCell>
            <TableCell>{item.events?.title || "N/A"}</TableCell>
            <TableCell>{item.amount} RWF</TableCell>
            <TableCell>{item.status}</TableCell>
            <TableCell>{format(new Date(item.created_at), "PPP")}</TableCell>
          </>
        )}
        {category === "classes" && (
          <>
            <TableCell>{item.title}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell>{item.capacity}</TableCell>
            <TableCell>{item.price} RWF</TableCell>
            <TableCell>{format(new Date(item.created_at), "PPP")}</TableCell>
          </>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Report Generator</h1>
            <p className="text-muted-foreground">
              Generate custom reports and export them as PDF
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Select the date range and category for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="messages">Messages</SelectItem>
                    <SelectItem value="bookings">Bookings</SelectItem>
                    <SelectItem value="classes">Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={generateReport} 
                  disabled={loading}
                  className="bg-gradient-primary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
                
                {showResults && reportData.length > 0 && (
                  <Button onClick={downloadPDF} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {showResults && (
            <Card>
              <CardHeader>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>
                  {reportData.length} records found from {format(new Date(startDate), "PPP")} to {format(new Date(endDate), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {renderTableHeaders()}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderTableRows()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reports;
