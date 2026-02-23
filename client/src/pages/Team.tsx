import { useTeamMembers, useTeamPerformance } from "@/hooks/use-team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, CheckCircle2, Clock } from "lucide-react";

export default function Team() {
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: performance, isLoading: perfLoading } = useTeamPerformance();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
        <p className="text-muted-foreground mt-1">Manage team members and track execution metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {membersLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : members?.map((member: any) => (
          <Card key={member.id} className="card-hover">
            <CardContent className="p-6 flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-sm text-primary mb-1">{member.role}</p>
                <a href={`mailto:${member.email}`} className="text-xs text-muted-foreground flex items-center hover:text-foreground transition-colors">
                  <Mail className="w-3 h-3 mr-1" /> {member.email}
                </a>
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
            {perfLoading ? <Skeleton className="h-full w-full" /> : (
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
            <div className="space-y-6">
              {perfLoading ? <Skeleton className="h-48" /> : performance?.map((perf: any) => (
                <div key={perf.memberId} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="font-medium">{perf.memberName}</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Rate</span>
                      <span className="font-semibold">{perf.completionRate}%</span>
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
