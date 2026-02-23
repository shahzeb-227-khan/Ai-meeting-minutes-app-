import { useState } from "react";
import { Link } from "wouter";
import { useMeetings, useCreateMeeting, useAnalyzeMeeting } from "@/hooks/use-meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Video, Sparkles, Calendar, Loader2, ArrowRight, UploadCloud } from "lucide-react";

export default function Meetings() {
  const { data: meetings, isLoading } = useMeetings();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground mt-1">Upload transcripts to extract action items and intelligence.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Sparkles className="w-5 h-5 text-primary mr-2" />
                Analyze New Meeting
              </DialogTitle>
            </DialogHeader>
            <UploadMeetingForm onSuccess={() => setIsUploadOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-secondary/50 animate-pulse border border-border/50" />
          ))
        ) : meetings?.map((meeting: any) => (
          <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
            <div className="group bg-card border border-border rounded-2xl p-6 card-hover cursor-pointer h-full flex flex-col relative overflow-hidden">
              {/* Decorative gradient blob */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 bg-secondary rounded-xl">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                {meeting.clarityScore && (
                  <div className="flex items-center text-sm font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    {meeting.clarityScore}/10
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-xl leading-tight mb-2 relative z-10">{meeting.title}</h3>
              
              <div className="flex items-center text-sm text-muted-foreground mb-6 relative z-10">
                <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
                {format(new Date(meeting.date), "MMMM d, yyyy")}
              </div>
              
              <div className="mt-auto border-t border-border pt-4 flex items-center justify-between relative z-10">
                <span className="text-sm font-medium px-3 py-1 bg-secondary rounded-md text-foreground">
                  {meeting.actionItemsCount || 0} Action Items
                </span>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-medium">
                  View <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}

        {meetings?.length === 0 && !isLoading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No meetings uploaded</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Upload your first meeting transcript to automatically extract action items, decisions, and risks.
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>Upload Transcript</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadMeetingForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  
  const createMeeting = useCreateMeeting();
  const analyzeMeeting = useAnalyzeMeeting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes) {
      toast({ title: "Error", description: "Title and notes are required", variant: "destructive" });
      return;
    }

    try {
      // 1. Create meeting
      const meeting = await createMeeting.mutateAsync({
        title,
        date: new Date(date),
        rawNotes: notes
      });

      // 2. Trigger AI analysis
      toast({ title: "Meeting Created", description: "AI is analyzing the transcript..." });
      await analyzeMeeting.mutateAsync(meeting.id);
      
      toast({ title: "Analysis Complete", description: "Action items extracted successfully." });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const isPending = createMeeting.isPending || analyzeMeeting.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Meeting Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 Roadmap Planning" disabled={isPending} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isPending} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Transcript / Notes</label>
        <Textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          placeholder="Paste meeting transcript or rough notes here..." 
          className="h-48 resize-none font-mono text-sm"
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          "Extract Action Items"
        )}
      </Button>
    </form>
  );
}
