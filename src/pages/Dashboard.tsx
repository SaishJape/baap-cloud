import { Bot, FileText, Clock, Plus, Upload, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { label: 'Total Chatbots', value: '3', icon: Bot, color: 'bg-secondary' },
  { label: 'PDFs Uploaded', value: '12', icon: FileText, color: 'bg-secondary' },
  { label: 'Last Updated', value: '2h ago', icon: Clock, color: 'bg-secondary' },
];

const quickActions = [
  { label: 'Create New Chatbot', icon: Plus, to: '/data', variant: 'default' as const },
  { label: 'Upload Data', icon: Upload, to: '/data', variant: 'outline' as const },
  { label: 'Configure LLM', icon: Settings, to: '/config', variant: 'outline' as const },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI chatbots and data from one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.to}>
                  <Button variant={action.variant} size="lg" className="gap-2">
                    <action.icon className="w-5 h-5" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Created chatbot', name: 'Support Bot', time: '2 hours ago' },
                { action: 'Uploaded PDF', name: 'Product Manual.pdf', time: '5 hours ago' },
                { action: 'Updated config', name: 'Switched to Gemini', time: '1 day ago' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}