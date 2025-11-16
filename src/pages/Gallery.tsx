import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  caption: string;
  event_id: string;
  created_at: string;
  events?: {
    title: string;
    class_category: string;
  };
}

const Gallery = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMedia();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredMedia(media);
    } else {
      setFilteredMedia(
        media.filter((item) => item.events?.class_category === selectedCategory)
      );
    }
  }, [selectedCategory, media]);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media")
      .select(`
        *,
        events (
          title,
          class_category
        )
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setMedia(data);
      setFilteredMedia(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Event Gallery</h1>
          <p className="text-muted-foreground mb-6">
            Explore photos and videos from our amazing dance events
          </p>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by category:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="salsa">Salsa</SelectItem>
                <SelectItem value="bachata">Bachata</SelectItem>
                <SelectItem value="kizomba">Kizomba</SelectItem>
                <SelectItem value="konpa">Konpa</SelectItem>
                <SelectItem value="semba">Semba</SelectItem>
                <SelectItem value="zouk">Zouk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading gallery...</div>
        ) : filteredMedia.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No media found. Check back soon for photos and videos from our events!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.caption || "Event photo"}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-4">
                    {item.events && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {item.events.class_category}
                        </Badge>
                        <span className="text-sm font-medium">{item.events.title}</span>
                      </div>
                    )}
                    {item.caption && (
                      <p className="text-sm text-muted-foreground">{item.caption}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
