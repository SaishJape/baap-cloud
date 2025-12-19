import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, CheckCircle, AlertCircle, TrendingUp, Plus } from 'lucide-react';
import { whatsappService } from '@/services/whatsappService';
import { Link } from 'react-router-dom';

export default function WhatsAppDashboard() {
    const [stats, setStats] = useState({
        total_messages: 0,
        delivered_rate: 0,
        campaigns_count: 0,
        failed_count: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const data = await whatsappService.getStats();
        setStats(data);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">WhatsApp Overview</h1>
                        <p className="text-muted-foreground">Monitor your bulk messaging campaigns and template status.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/whatsapp/campaigns">
                            <Button className="gap-2">
                                <Send className="w-4 h-4" />
                                New Campaign
                            </Button>
                        </Link>
                        <Link to="/whatsapp/templates">
                            <Button variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />
                                New Template
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_messages.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                <span className="text-green-500 font-medium">+12%</span> from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivered Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.delivered_rate}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Global delivery success
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.campaigns_count}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Running currently
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.failed_count}</div>
                            <p className="text-xs text-muted-foreground mt-1 text-red-500">
                                Requires attention
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity / Graph placeholder could go here */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full flex items-center justify-center bg-secondary/20 rounded-lg border border-dashed border-secondary">
                            <p className="text-muted-foreground">Analytics Chart Placeholder</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
