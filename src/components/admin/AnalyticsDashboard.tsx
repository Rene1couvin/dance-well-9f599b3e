import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>;
  enrollmentTrends: Array<{ month: string; enrollments: number }>;
  popularClasses: Array<{ name: string; enrollments: number }>;
  revenueData: Array<{ month: string; revenue: number }>;
  totalRevenue: number;
  monthlyGrowth: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch user growth data
    const { data: profiles } = await supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    // Fetch enrollment data
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("enrolled_at, classes(title)")
      .order("enrolled_at", { ascending: true });

    // Fetch revenue data
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, created_at, status")
      .eq("status", "completed");

    // Process user growth by month
    const userGrowthMap = new Map<string, number>();
    profiles?.forEach((profile) => {
      const month = new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      userGrowthMap.set(month, (userGrowthMap.get(month) || 0) + 1);
    });

    const userGrowth = Array.from(userGrowthMap.entries()).map(([month, users]) => ({
      month,
      users,
    }));

    // Process enrollment trends
    const enrollmentMap = new Map<string, number>();
    enrollments?.forEach((enrollment) => {
      const month = new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      enrollmentMap.set(month, (enrollmentMap.get(month) || 0) + 1);
    });

    const enrollmentTrends = Array.from(enrollmentMap.entries()).map(([month, enrollments]) => ({
      month,
      enrollments,
    }));

    // Process popular classes
    const classMap = new Map<string, number>();
    enrollments?.forEach((enrollment) => {
      const className = enrollment.classes?.title || "Unknown";
      classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    const popularClasses = Array.from(classMap.entries())
      .map(([name, enrollments]) => ({ name, enrollments }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // Process revenue data
    const revenueMap = new Map<string, number>();
    let totalRevenue = 0;
    payments?.forEach((payment) => {
      const month = new Date(payment.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      const amount = parseFloat(payment.amount?.toString() || "0");
      revenueMap.set(month, (revenueMap.get(month) || 0) + amount);
      totalRevenue += amount;
    });

    const revenueData = Array.from(revenueMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    // Calculate monthly growth
    const currentMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
    const previousMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 1;
    const monthlyGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

    setAnalytics({
      userGrowth,
      enrollmentTrends,
      popularClasses,
      revenueData,
      totalRevenue,
      monthlyGrowth,
    });

    setLoading(false);
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalRevenue.toLocaleString()} RWF</div>
            <p className="text-xs text-muted-foreground">
              <span className={analytics && analytics.monthlyGrowth > 0 ? "text-green-600" : "text-red-600"}>
                {analytics?.monthlyGrowth.toFixed(1)}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.userGrowth.reduce((sum, data) => sum + data.users, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.enrollmentTrends.reduce((sum, data) => sum + data.enrollments, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Class registrations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends</CardTitle>
            <CardDescription>Class enrollments by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.enrollmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enrollments" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Classes</CardTitle>
            <CardDescription>Top 5 classes by enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.popularClasses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enrollments" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Tracking</CardTitle>
            <CardDescription>Monthly revenue from bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
