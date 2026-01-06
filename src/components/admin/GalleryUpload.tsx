import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface SelectedFile {
  file: File;
  preview: string;
  caption: string;
}

const GalleryUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [selectedFiles]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .order("start_time", { ascending: false });
    
    if (data) setEvents(data);
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (validFiles.length !== fileArray.length) {
      toast({
        title: "Some files skipped",
        description: "Only images and videos are allowed",
        variant: "destructive",
      });
    }

    const newFiles: SelectedFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], caption };
      return newFiles;
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0 || !user) {
      toast({
        title: "Error",
        description: "Please select at least one file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const selectedFile of selectedFiles) {
        try {
          const fileExt = selectedFile.file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("gallery")
            .upload(filePath, selectedFile.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("gallery")
            .getPublicUrl(filePath);

          const { error: dbError } = await supabase
            .from("media")
            .insert([{
              url: publicUrl,
              type: selectedFile.file.type.startsWith("image/") ? "image" : "video",
              caption: selectedFile.caption || null,
              event_id: eventId && eventId !== "none" ? eventId : null,
              uploaded_by: user.id,
            }]);

          if (dbError) throw dbError;
          successCount++;
        } catch (error) {
          console.error("Upload error for file:", selectedFile.file.name, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload Complete!",
          description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Upload Failed",
          description: "All files failed to upload",
          variant: "destructive",
        });
      }

      // Clear successfully uploaded files
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setEventId("");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload to Gallery</CardTitle>
        <CardDescription>
          Drag and drop or select multiple photos and videos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">
                {isDragging ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse (images & videos)
              </p>
            </div>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="relative border rounded-lg p-3 space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      {item.file.type.startsWith("image/") ? (
                        <img 
                          src={item.preview} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm truncate flex-1 pr-6">{item.file.name}</p>
                    </div>
                    <Input
                      placeholder="Add caption (optional)"
                      value={item.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="event">Link to Event (Optional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={uploading || selectedFiles.length === 0} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : "Media"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GalleryUpload;
