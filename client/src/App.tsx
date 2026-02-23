import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Meetings from "@/pages/Meetings";
import MeetingDetails from "@/pages/MeetingDetails";
import ActionTracker from "@/pages/ActionTracker";
import Team from "@/pages/Team";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/meetings" component={Meetings} />
        <Route path="/meetings/:id" component={MeetingDetails} />
        <Route path="/actions" component={ActionTracker} />
        <Route path="/team" component={Team} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
