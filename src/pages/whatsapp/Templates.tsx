import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Loader2, CheckCircle, Clock, XCircle, MoreVertical, FileSpreadsheet } from 'lucide-react';
import { whatsappService, WhatsAppTemplate } from '@/services/whatsappService';
import { toast } from 'sonner';

export default function WhatsAppTemplates() {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        category: 'MARKETING' as const,
        language: 'en_US',
        bodyText: '',
        headerText: '',
        footerText: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await whatsappService.getTemplates();
            setTemplates(data);
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTemplate.name || !newTemplate.bodyText) {
            toast.error("Name and Body text are required");
            return;
        }

        try {
            setCreating(true);
            const payload: any = {
                name: newTemplate.name,
                category: newTemplate.category,
                language: newTemplate.language,
                components: [
                    { type: 'BODY', text: newTemplate.bodyText }
                ]
            };

            if (newTemplate.headerText) {
                payload.components.push({ type: 'HEADER', format: 'TEXT', text: newTemplate.headerText });
            }
            if (newTemplate.footerText) {
                payload.components.push({ type: 'FOOTER', text: newTemplate.footerText });
            }

            await whatsappService.createTemplate(payload);
            toast.success("Template submitted for approval");
            setIsCreateOpen(false);
            fetchTemplates();
            setNewTemplate({ name: '', category: 'MARKETING', language: 'en_US', bodyText: '', headerText: '', footerText: '' });
        } catch (error) {
            toast.error("Failed to create template");
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default'; // primary/black
            case 'PENDING': return 'secondary'; // gray
            case 'REJECTED': return 'destructive'; // red
            default: return 'outline';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Message Templates</h1>
                        <p className="text-muted-foreground">Manage your WhatsApp message templates.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Create Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Template</DialogTitle>
                                <DialogDescription>
                                    Define the structure of your WhatsApp message. Templates must be approved by Meta before use.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Template Name</Label>
                                        <Input
                                            placeholder="e.g. welcome_offer_v1"
                                            value={newTemplate.name}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                        />
                                        <p className="text-xs text-muted-foreground">LowerCase, underscores only.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={newTemplate.category}
                                            onValueChange={(val: any) => setNewTemplate({ ...newTemplate, category: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MARKETING">Marketing</SelectItem>
                                                <SelectItem value="UTILITY">Utility</SelectItem>
                                                <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Header (Optional)</Label>
                                    <Input
                                        placeholder="Add a title or image header..."
                                        value={newTemplate.headerText}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, headerText: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Body Text</Label>
                                    <Textarea
                                        placeholder="Hello {{1}}, we have a special offer for you!"
                                        className="h-32 resize-none"
                                        value={newTemplate.bodyText}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, bodyText: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Use {'{{1}}'}, {'{{2}}'} etc. for variables.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Footer (Optional)</Label>
                                    <Input
                                        placeholder="Add a short footer..."
                                        value={newTemplate.footerText}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, footerText: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Submit for Review
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Search templates..." />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl border-muted-foreground/25 text-center p-8">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No Templates Found</h3>
                        <p className="text-muted-foreground mb-4">Create your first template to start sending messages.</p>
                        <Button onClick={() => setIsCreateOpen(true)}>Create Template</Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => (
                            <Card key={template.id} className="relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="text-xs font-normal">{template.category}</Badge>
                                                <Badge variant="secondary" className="text-xs font-normal">{template.language}</Badge>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusColor(template.status) as any}>
                                            {template.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-3">
                                    {template.components.find(c => c.type === 'HEADER')?.text && (
                                        <p className="font-semibold text-foreground">{template.components.find(c => c.type === 'HEADER')?.text}</p>
                                    )}
                                    <p className="line-clamp-3">
                                        {template.components.find(c => c.type === 'BODY')?.text}
                                    </p>
                                    {template.components.find(c => c.type === 'FOOTER')?.text && (
                                        <p className="text-xs italic text-muted-foreground/70">{template.components.find(c => c.type === 'FOOTER')?.text}</p>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center border-t pt-4">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
