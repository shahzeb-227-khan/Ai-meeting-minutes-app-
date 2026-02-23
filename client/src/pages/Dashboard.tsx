import { useDashboardStats, useMeetingIntelligence } from "@/hooks/use-dashboard";
import { useMeetings } from "@/hooks/use-meetings";
import { Link } from "wouter";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, CheckCircle2, AlertCircle, Clock, Video, Plus, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: intel, isLoading: intelLoading } = useMeetingIntelligence();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();

  // Mock data for the completion trend chart
  const trendData = [
    { name: 'Mon', completed: 4 },
    { name: 'Tue', completed: 7 },
    { name: 'Wed', completed: 5 },
    { name: 'Thu', completed: 11 },
    { name: 'Fri', completed: 8 },
    { name: 'Sat', completed: 2 },
    { name: 'Sun', completed: 9 },
  ];

  const pieData = intel ? [
    { name: 'Decisions', value: intel.decisionVsDiscussionRatio },
    { name: 'Discussions', value: 100 - intel.decisionVsDiscussionRatio },
  ] : [];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, Alex</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your team's execution.</p>
        </div>
        <Link href="/meetings">
          <Button className="rounded-full shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
            <Plus className="w-4 h-4 mr-2" />
            Upload Meeting
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Meetings" 
          value={stats?.totalMeetings} 
          icon={<Video className="w-4 h-4 text-blue-500" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Open Actions" 
          value={stats?.openActionItems} 
          icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Overdue Tasks" 
          value={stats?.overdueActionItems} 
          icon={<Clock className="w-4 h-4 text-destructive" />}
          loading={statsLoading}
        />
        <StatCard 
          title="Completion Rate" 
          value={stats ? `${stats.completionRate}%` : undefined} 
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          loading={statsLoading}
          trend="+5.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Action Completion Trend</h2>
              <p className="text-sm text-muted-foreground">Tasks completed over the last 7 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meeting Intelligence */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-6">Execution Intelligence</h2>
          
          {intelLoading ? (
            <div className="space-y-4 flex-1"><Skeleton className="h-full w-full" /></div>
          ) : intel ? (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={30}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-2xl font-bold">{intel.decisionVsDiscussionRatio}%</div>
                  <div className="text-sm text-muted-foreground">Action Ratio</div>
                  <div className="text-xs text-green-500 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Healthy balance
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <h3 className="text-sm font-medium text-muted-foreground">Identified Risks</h3>
                {intel.topRisks.slice(0,3).map((risk, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm bg-secondary/50 p-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">No data available</div>
          )}
        </div>
      </div>

      {/* Recent Meetings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Meetings</h2>
          <Link href="/meetings" className="text-sm text-primary hover:underline flex items-center">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetingsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : meetings?.slice(0, 3).map((meeting: any) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 card-hover cursor-pointer h-full flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-1">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {format(new Date(meeting.date), "MMM d, yyyy")}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    {meeting.actionItemsCount || 0} Actions
                  </span>
                  {meeting.clarityScore && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-secondary rounded-full flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                      {meeting.clarityScore}/10 Score
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {meetings?.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first meeting transcript to get started.</p>
              <Link href="/meetings">
                <Button variant="outline">Upload Meeting</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading, trend }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-secondary rounded-lg">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <h3 className="text-3xl font-bold tracking-tight">{value !== undefined ? value : '-'}</h3>
            {trend && <span className="text-xs font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{trend}</span>}
          </>
        )}
      </div>
    </div>
  );
}
