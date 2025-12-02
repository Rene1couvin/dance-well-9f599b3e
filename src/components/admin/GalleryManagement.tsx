import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PrintButton from "./PrintButton";

export default function GalleryManagement() {
  const { user } = useAuth();
  const [media, setMedia] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    caption: "",
    event_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMedia();
    fetchEvents();
    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (data) setUserRole(data.role);
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .order("start_time", { ascending: false });
    if (data) setEvents(data);
  };

  const fetchMedia = async () => {
    const { data } = await supabase
      .from("media")
      .select("*, events(title)")
      .order("created_at", { ascending: false });
    
    if (data) setMedia(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, url: string) => {
    // Only super_admin can delete
    if (userRole !== 'super_admin') {
      toast({ title: "Error", description: "Only Super Admins can delete media", variant: "destructive" });
      return;
    }
    
    if (!confirm("Delete this media?")) return;

    const { error } = await supabase.from("media").delete().eq("id", id);
    
    if (!error) {
      toast({ title: "Success", description: "Media deleted" });
      fetchMedia();
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !user) return;

    try {
      // Upload to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          url: publicUrl,
          type: uploadForm.file.type.startsWith('image/') ? 'image' : 'video',
          caption: uploadForm.caption,
          event_id: uploadForm.event_id || null,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Media uploaded successfully" });
      setShowUploadDialog(false);
      setUploadForm({ file: null, caption: "", event_id: "" });
      fetchMedia();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateCaption = async (id: string) => {
    const { error } = await supabase
      .from("media")
      .update({ caption: editCaption })
      .eq("id", id);

    if (!error) {
      toast({ title: "Success", description: "Caption updated" });
      setEditingId(null);
      fetchMedia();
    }
  };

  const canUpload = userRole === 'super_admin' || userRole === 'editor';
  const canEdit = userRole === 'super_admin' || userRole === 'editor';
  const canDelete = userRole === 'super_admin';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gallery Management</CardTitle>
            <CardDescription>Manage uploaded media</CardDescription>
          </div>
          <div className="flex gap-2">
            {canUpload && (
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Gallery Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                    <DialogDescription>
                      Add a new image or video to the gallery
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Media File</label>
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Caption</label>
                      <Textarea
                        placeholder="Enter caption"
                        value={uploadForm.caption}
                        onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Event (Optional)</label>
                      <Select
                        value={uploadForm.event_id}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, event_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUpload} disabled={!uploadForm.file} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <PrintButton tableId="gallery-table" title="Gallery" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id="gallery-table" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {media.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              {item.type === "image" ? (
                <img src={item.url} alt={item.caption} className="w-full h-48 object-cover rounded mb-2" />
              ) : (
                <video src={item.url} className="w-full h-48 rounded mb-2" controls />
              )}
              
              {editingId === item.id ? (
                <div className="space-y-2">
                  <Input
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Caption"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateCaption(item.id)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-2">{item.caption || "No caption"}</p>
                  <div className="flex gap-2">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditCaption(item.caption || "");
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id, item.url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
