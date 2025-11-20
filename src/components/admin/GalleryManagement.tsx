import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import PrintButton from "./PrintButton";

export default function GalleryManagement() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    const { data } = await supabase
      .from("media")
      .select("*, events(title)")
      .order("created_at", { ascending: false });
    
    if (data) setMedia(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Delete this media?")) return;

    const { error } = await supabase.from("media").delete().eq("id", id);
    
    if (!error) {
      toast({ title: "Success", description: "Media deleted" });
      fetchMedia();
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gallery Management</CardTitle>
            <CardDescription>Manage uploaded media</CardDescription>
          </div>
          <PrintButton tableId="gallery-table" title="Gallery" />
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
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id, item.url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
