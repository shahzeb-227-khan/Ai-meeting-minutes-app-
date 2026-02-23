import { useParams, Link } from "wouter";
import { useMeeting } from "@/hooks/use-meetings";
import { format } from "date-fns";
import { ChevronLeft, Calendar, FileText, CheckCircle, AlertTriangle, Lightbulb, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function MeetingDetails() {
  const { id } = useParams();
  const { data: meeting, isLoading } = useMeeting(Number(id));

  if (isLoading) return <MeetingDetailsSkeleton />;
  if (!meeting) return <div className="text-center py-20 text-muted-foreground">Meeting not found</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link href="/meetings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Meetings
      </Link>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{meeting.title}</h1>
            <div className="flex items-center text-muted-foreground gap-4">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {format(new Date(meeting.date), "MMMM d, yyyy")}</span>
              <span className="flex items-center"><FileText className="w-4 h-4 mr-1.5" /> {meeting.actionItemsCount || 0} Actions</span>
            </div>
          </div>
          {meeting.clarityScore && (
            <div className="flex flex-col items-center justify-center bg-secondary/80 backdrop-blur-sm p-4 rounded-2xl border border-border/50">
              <span className="text-3xl font-bold text-primary">{meeting.clarityScore}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Clarity Score</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Summary */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-amber-500" /> Executive Summary
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {meeting.summary || "No summary generated yet. Try running analysis again."}
            </p>
          </section>

          {/* Action Items List within Meeting */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Extracted Action Items
            </h2>
            <div className="space-y-3">
              {meeting.actionItems?.length > 0 ? meeting.actionItems.map((item: any) => (
                <div key={item.id} className="p-4 rounded-xl border border-border/50 bg-secondary/30 flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                    {item.status === 'done' && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{item.title}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-normal capitalize">{item.priority}</Badge>
                      {item.assignee && (
                        <Badge variant="secondary" className="text-xs font-normal flex items-center">
                          <User className="w-3 h-3 mr-1" /> {item.assignee.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No action items extracted.</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Decisions */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Key Decisions</h2>
            <ul className="space-y-3">
              {meeting.decisions?.map((d: string, i: number) => (
                <li key={i} className="flex items-start text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2.5 shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </li>
              )) || <p className="text-sm text-muted-foreground">No explicit decisions detected.</p>}
            </ul>
          </section>

          {/* Risks */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-destructive flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Identified Risks
            </h2>
            <ul className="space-y-3">
              {meeting.risks?.map((r: string, i: number) => (
                <li key={i} className="flex items-start text-sm bg-destructive/5 p-2 rounded text-destructive/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 mr-2.5 shrink-0" />
                  <span>{r}</span>
                </li>
              )) || <p className="text-sm text-muted-foreground">No risks identified.</p>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function MeetingDetailsSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
