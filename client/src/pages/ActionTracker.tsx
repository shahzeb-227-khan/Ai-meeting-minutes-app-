import { useState } from "react";
import { useActionItems, useUpdateActionItem } from "@/hooks/use-action-items";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, PlayCircle, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

export default function ActionTracker() {
  const { data: actions, isLoading } = useActionItems();
  
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Action Tracker</h1>
        <p className="text-muted-foreground mt-1">Manage and track execution across all meetings.</p>
      </div>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <TabsList className="w-max mb-4">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="table">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="flex-1 mt-0">
          <KanbanBoard actions={actions || []} loading={isLoading} />
        </TabsContent>
        <TabsContent value="table" className="flex-1 mt-0">
          <TableView actions={actions || []} loading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Very simple, robust HTML5 drag and drop Kanban
function KanbanBoard({ actions, loading }: { actions: any[], loading: boolean }) {
  const updateAction = useUpdateActionItem();
  
  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock, color: 'text-muted-foreground' },
    { id: 'in-progress', title: 'In Progress', icon: PlayCircle, color: 'text-blue-500' },
    { id: 'blocked', title: 'Blocked', icon: AlertCircle, color: 'text-destructive' },
    { id: 'done', title: 'Done', icon: CheckCircle, color: 'text-green-500' },
  ];

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("taskId", id.toString());
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    if (taskId) {
      updateAction.mutate({ id: taskId, status });
    }
  };

  if (loading) return <div className="animate-pulse flex gap-4 h-[600px]"><div className="flex-1 bg-secondary/50 rounded-xl" /><div className="flex-1 bg-secondary/50 rounded-xl" /><div className="flex-1 bg-secondary/50 rounded-xl" /></div>;

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4 kanban-scroll items-start">
      {columns.map(col => {
        const columnActions = actions.filter(a => a.status === col.id);
        return (
          <div 
            key={col.id} 
            className="w-80 shrink-0 flex flex-col bg-secondary/30 rounded-2xl border border-border/50 max-h-full"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <col.icon className={`w-4 h-4 mr-2 ${col.color}`} />
                {col.title}
              </h3>
              <Badge variant="secondary">{columnActions.length}</Badge>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto kanban-scroll space-y-3">
              {columnActions.map(action => (
                <div 
                  key={action.id}
                  draggable
                  onDragStart={e => handleDragStart(e, action.id)}
                  className={`bg-card p-4 rounded-xl border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${action.status === 'done' ? 'opacity-70' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={action.priority === 'high' || action.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0 h-5">
                      {action.priority}
                    </Badge>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer" />
                  </div>
                  <h4 className={`font-medium text-sm mb-3 ${action.status==='done' ? 'line-through text-muted-foreground' : ''}`}>{action.title}</h4>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                    <div className="flex items-center text-xs text-muted-foreground">
                      {action.dueDate ? format(new Date(action.dueDate), "MMM d") : "No date"}
                    </div>
                    {action.assignee && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30" title={action.assignee.name}>
                        {action.assignee.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {columnActions.length === 0 && (
                <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm">
                  Drop items here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}

function TableView({ actions, loading }: { actions: any[], loading: boolean }) {
  if (loading) return <div className="h-64 bg-secondary/50 rounded-xl animate-pulse" />;
  
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4">Task</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Assignee</th>
              <th className="px-6 py-4">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {actions.map(action => (
              <tr key={action.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                <td className="px-6 py-4 font-medium">
                  <div className={`line-clamp-1 ${action.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{action.title}</div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="capitalize">{action.status.replace('-', ' ')}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className={`capitalize ${action.priority === 'urgent' ? 'text-destructive font-bold' : ''}`}>{action.priority}</span>
                </td>
                <td className="px-6 py-4">
                  {action.assignee?.name || <span className="text-muted-foreground italic">Unassigned</span>}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {action.dueDate ? format(new Date(action.dueDate), "MMM d, yyyy") : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {actions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No action items found.</div>
        )}
      </div>
    </div>
  );
}
