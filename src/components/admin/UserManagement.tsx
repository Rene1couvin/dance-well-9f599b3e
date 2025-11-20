import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import PrintButton from "./PrintButton";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*")
    ]);

    if (profilesRes.data) {
      setUsers(profilesRes.data);
    }

    if (rolesRes.data) {
      const roleMap: Record<string, string[]> = {};
      rolesRes.data.forEach((role: UserRole) => {
        if (!roleMap[role.user_id]) roleMap[role.user_id] = [];
        roleMap[role.user_id].push(role.role);
      });
      setUserRoles(roleMap);
    }

    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Remove existing roles
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Add new role
    const { error } = await supabase.from("user_roles").insert([{
      user_id: userId,
      role: newRole as "student" | "editor" | "super_admin",
    }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </div>
          <PrintButton tableId="users-table" title="User Management" />
        </div>
      </CardHeader>
      <CardContent>
        <div id="users-table">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Change Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {userRoles[user.id]?.map((role) => (
                    <Badge key={role} variant="secondary" className="mr-1">
                      {role}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    defaultValue={userRoles[user.id]?.[0] || "student"}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
