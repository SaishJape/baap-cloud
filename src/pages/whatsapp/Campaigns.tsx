
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Download, FileSpreadsheet, Check, Send, AlertCircle, FileText } from 'lucide-react';
import { whatsappService, WhatsAppTemplate, WhatsAppCampaign } from '@/services/whatsappService';
import { toast } from 'sonner';

export default function WhatsAppCampaigns() {
    const [activeTab, setActiveTab] = useState('new');
    const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    // New Campaign Wizard State
    const [step, setStep] = useState(1);
    const [campaignData, setCampaignData] = useState({
        name: '',
        templateId: '',
        file: null as File | null
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [cData, tData] = await Promise.all([
            whatsappService.getCampaigns(),
            whatsappService.getTemplates()
        ]);
        setCampaigns(cData);
        setTemplates(tData.filter(t => t.status === 'APPROVED'));
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCampaignData({ ...campaignData, file: e.target.files[0] });
        }
    };

    const handleSendCampaign = async () => {
        if (!campaignData.name || !campaignData.templateId || !campaignData.file) {
            toast.error("Please complete all steps");
            return;
        }

        setSending(true);
        try {
            await whatsappService.createCampaign(campaignData.name, campaignData.templateId, campaignData.file);
            toast.success("Campaign scheduled successfully!");
            setStep(1);
            setCampaignData({ name: '', templateId: '', file: null });
            setActiveTab('history');
            fetchData();
        } catch (error) {
            toast.error("Failed to send campaign");
        } finally {
            setSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'default'; // primary
            case 'PROCESSING': return 'secondary';
            case 'SCHEDULED': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
                    <p className="text-muted-foreground">Create and manage your bulk message campaigns.</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="new" className="gap-2"><Plus className="w-4 h-4" /> New Campaign</TabsTrigger>
                        <TabsTrigger value="history" className="gap-2"><FileText className="w-4 h-4" /> History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Bulk Campaign</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Stepper Visual */}
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-8">
                                    <div className={`flex items - center gap - 2 ${step >= 1 ? 'text-primary' : ''} `}>
                                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center border - 2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-muted'} `}>1</div>
                                        Setup
                                    </div>
                                    <div className="h-[2px] w-12 bg-muted-foreground/20" />
                                    <div className={`flex items - center gap - 2 ${step >= 2 ? 'text-primary' : ''} `}>
                                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center border - 2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-muted'} `}>2</div>
                                        Audience
                                    </div>
                                    <div className="h-[2px] w-12 bg-muted-foreground/20" />
                                    <div className={`flex items - center gap - 2 ${step >= 3 ? 'text-primary' : ''} `}>
                                        <div className={`w - 8 h - 8 rounded - full flex items - center justify - center border - 2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-muted'} `}>3</div>
                                        Review
                                    </div>
                                </div>

                                {/* Step 1: Setup */}
                                {step === 1 && (
                                    <div className="grid gap-4 max-w-xl animate-fade-in">
                                        <div className="space-y-2">
                                            <Label>Campaign Name</Label>
                                            <Input
                                                placeholder="e.g. November Newsletter"
                                                value={campaignData.name}
                                                onChange={e => setCampaignData({ ...campaignData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Select Template</Label>
                                            <Select
                                                value={campaignData.templateId}
                                                onValueChange={val => setCampaignData({ ...campaignData, templateId: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose an approved template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name} ({t.language})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {templates.length === 0 && !loading && <p className="text-xs text-red-500">No approved templates found. Go create one first.</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Audience */}
                                {step === 2 && (
                                    <div className="space-y-4 max-w-xl animate-fade-in">
                                        <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                                            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
                                            <Label htmlFor="file-upload" className="mb-2 text-lg font-medium cursor-pointer">
                                                {campaignData.file ? campaignData.file.name : "Upload Recipient List (CSV/Excel)"}
                                            </Label>
                                            <p className="text-sm text-muted-foreground mb-4">Must contain 'phone' column.</p>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                accept=".csv,.xlsx,.xls"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
                                                Select File
                                            </Button>
                                        </div>
                                        {campaignData.file && (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                                                <Check className="w-4 h-4" />
                                                <span className="text-sm">File ready for processing</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Review */}
                                {step === 3 && (
                                    <div className="space-y-4 max-w-xl animate-fade-in">
                                        <Card className="bg-muted/50">
                                            <CardContent className="pt-6 space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Campaign:</span>
                                                    <span className="font-medium">{campaignData.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Template:</span>
                                                    <span className="font-medium">{templates.find(t => t.id === campaignData.templateId)?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">File:</span>
                                                    <span className="font-medium">{campaignData.file?.name}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <div className="text-sm text-yellow-600 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Messages will be sent immediately upon confirmation.
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Back</Button>
                                {step < 3 ? (
                                    <Button onClick={() => setStep(s => s + 1)} disabled={(step === 1 && (!campaignData.name || !campaignData.templateId)) || (step === 2 && !campaignData.file)}>
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button onClick={handleSendCampaign} disabled={sending}>
                                        {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        <Send className="w-4 h-4 mr-2" />
                                        Launch Campaign
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        {loading ? (
                            <div className="flex justify-center h-40 items-center"><Loader2 className="animate-spin" /></div>
                        ) : campaigns.length === 0 ? (
                            <Card><CardContent className="p-8 text-center text-muted-foreground">No past campaigns found.</CardContent></Card>
                        ) : (
                            <div className="grid gap-4">
                                {campaigns.map(campaign => (
                                    <Card key={campaign.id}>
                                        <CardHeader className="flex flex-row items-center justify-between py-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">Template: {campaign.templateName} • {new Date(campaign.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant={getStatusColor(campaign.status) as any}>{campaign.status}</Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Progress ({campaign.stats.sent}/{campaign.totalRecipients})</span>
                                                    <span>{Math.round((campaign.stats.sent / campaign.totalRecipients) * 100)}%</span>
                                                </div>
                                                <Progress value={(campaign.stats.sent / campaign.totalRecipients) * 100} />
                                                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                                                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> {campaign.stats.delivered} Delivered</span>
                                                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-blue-500" /> {campaign.stats.read} Read</span>
                                                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> {campaign.stats.failed} Failed</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="py-3 bg-secondary/10 flex justify-end">
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Download className="w-4 h-4" />
                                                Download Report
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

