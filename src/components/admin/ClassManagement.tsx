import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Class {
  id: string;
  title: string;
  description: string;
  category: string;
  schedule: string;
  price: number;
  capacity: number;
  location: string;
  is_active: boolean;
}

export default function ClassManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk";
    schedule: string;
    price: number;
    capacity: number;
    location: string;
    class_type: "regular" | "private";
    regular_price: number;
    private_price: number;
    fixed_days: string[];
    available_days: string[];
  }>({
    title: "",
    description: "",
    category: "salsa",
    schedule: "",
    price: 0,
    capacity: 20,
    location: "",
    class_type: "regular",
    regular_price: 0,
    private_price: 0,
    fixed_days: [],
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("created_at", { ascending: false });
    if (data) setClasses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const classData = {
      ...formData,
      created_by: user.id,
      is_active: true,
    };

    if (editingClass) {
      const { error } = await supabase
        .from("classes")
        .update(classData)
        .eq("id", editingClass.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update class", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Class updated successfully" });
        resetForm();
        fetchClasses();
      }
    } else {
      const { error } = await supabase.from("classes").insert(classData);

      if (error) {
        toast({ title: "Error", description: "Failed to create class", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Class created successfully" });
        resetForm();
        fetchClasses();
      }
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description || "",
      category: classItem.category as "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk",
      schedule: classItem.schedule || "",
      price: classItem.price || 0,
      capacity: classItem.capacity,
      location: classItem.location || "",
      class_type: classItem.class_type || "regular",
      regular_price: classItem.regular_price || 0,
      private_price: classItem.private_price || 0,
      fixed_days: classItem.fixed_days || [],
      available_days: classItem.available_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Class deleted successfully" });
      fetchClasses();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "salsa",
      schedule: "",
      price: 0,
      capacity: 20,
      location: "",
      class_type: "regular",
      regular_price: 0,
      private_price: 0,
      fixed_days: [],
      available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const toggleDay = (day: string, field: 'fixed_days' | 'available_days') => {
    const currentDays = formData[field];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, [field]: currentDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, [field]: [...currentDays, day] });
    }
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>Create and manage dance classes</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Add Class"}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <Input
                placeholder="Class Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as "salsa" | "bachata" | "kizomba" | "konpa" | "semba" | "zouk" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salsa">Salsa</SelectItem>
                  <SelectItem value="bachata">Bachata</SelectItem>
                  <SelectItem value="kizomba">Kizomba</SelectItem>
                  <SelectItem value="konpa">Konpa</SelectItem>
                  <SelectItem value="semba">Semba</SelectItem>
                  <SelectItem value="zouk">Zouk</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Schedule (e.g., Mon, Wed, Fri 6-7 PM)"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Class Type</label>
                <Select
                  value={formData.class_type}
                  onValueChange={(value) => setFormData({ ...formData, class_type: value as "regular" | "private" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Regular Price (RWF)</label>
                  <Input
                    type="number"
                    placeholder="Regular Price"
                    value={formData.regular_price}
                    onChange={(e) => setFormData({ ...formData, regular_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Private Price (RWF)</label>
                  <Input
                    type="number"
                    placeholder="Private Price"
                    value={formData.private_price}
                    onChange={(e) => setFormData({ ...formData, private_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fixed Days (Regular Classes)</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={formData.fixed_days.includes(day) ? "default" : "outline"}
                      onClick={() => toggleDay(day, 'fixed_days')}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available Days (Private Classes)</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={formData.available_days.includes(day) ? "default" : "outline"}
                      onClick={() => toggleDay(day, 'available_days')}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Capacity</label>
                <Input
                  type="number"
                  placeholder="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">{editingClass ? "Update" : "Create"} Class</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{classItem.category}</Badge>
                  </TableCell>
                  <TableCell>{classItem.schedule}</TableCell>
                  <TableCell>{classItem.price} RWF</TableCell>
                  <TableCell>
                    <Badge variant={classItem.is_active ? "default" : "destructive"}>
                      {classItem.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(classItem)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(classItem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
