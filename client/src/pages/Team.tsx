import { useTeamMembers, useTeamPerformance } from "@/hooks/use-team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, CheckCircle2, Clock, Users } from "lucide-react";

export default function Team() {
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: performance, isLoading: perfLoading } = useTeamPerformance();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
        <p className="text-muted-foreground mt-1">Manage team members and track execution metrics.</p>
      </div>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {membersLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : members?.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center text-center bg-card border border-dashed border-border rounded-2xl">
            <Users className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-semibold">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first team member to get started.</p>
          </div>
        ) : members?.map((member: any) => (
          <Card key={member.id} className="card-hover overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`} />
                  <AvatarFallback className="font-semibold bg-primary/10 text-primary">{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="font-semibold text-base truncate leading-tight">{member.name}</h3>
                  <p className="text-sm text-primary truncate mt-0.5">{member.role}</p>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mt-1.5 min-w-0"
                  >
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion by Member</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {perfLoading ? <Skeleton className="h-full w-full" /> :
            !performance || performance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-medium text-sm">No performance data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Assign tasks to team members to see metrics</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="memberName" type="category" axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--secondary))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="completedTasks" name="Completed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="totalTasks" name="Assigned" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {perfLoading ? (
                <Skeleton className="h-48" />
              ) : !performance || performance.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <Clock className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No metrics yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Assign action items to track team performance</p>
                </div>
              ) : performance?.map((perf: any) => (
                <div key={perf.memberId} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="font-medium truncate max-w-[140px]">{perf.memberName}</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Rate</span>
                      <span className="font-semibold">{Math.round(perf.completionRate)}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground flex items-center"><Clock className="w-3 h-3 mr-1" /> Overdue</span>
                      <span className={`font-semibold ${perf.overdueTasks > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {perf.overdueTasks}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
