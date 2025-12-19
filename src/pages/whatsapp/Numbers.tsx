import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Phone, Loader2, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { whatsappService, WhatsAppPhoneNumber } from '@/services/whatsappService';
import { toast } from 'sonner';

export default function WhatsAppNumbers() {
    const [numbers, setNumbers] = useState<WhatsAppPhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Verification State
    const [verifyStep, setVerifyStep] = useState(1);
    const [verifying, setVerifying] = useState(false);
    const [newNumber, setNewNumber] = useState({ phone: '', name: '', code: '' });

    useEffect(() => {
        fetchNumbers();
    }, []);

    const fetchNumbers = async () => {
        try {
            const data = await whatsappService.getPhoneNumbers();
            setNumbers(data);
        } catch (error) {
            toast.error("Failed to load numbers");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!newNumber.phone || !newNumber.name) {
            toast.error("Phone number and name are required");
            return;
        }
        setVerifying(true);
        try {
            await whatsappService.registerPhoneNumber(newNumber.phone, newNumber.name);
            toast.success("OTP sent to " + newNumber.phone);
            setVerifyStep(2);
        } catch (error) {
            toast.error("Failed to send OTP");
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!newNumber.code) {
            toast.error("Please enter the verification code");
            return;
        }
        setVerifying(true);
        try {
            await whatsappService.verifyOTP(newNumber.phone, newNumber.code);
            toast.success("Number verified successfully!");
            setIsAddOpen(false);
            setVerifyStep(1);
            setNewNumber({ phone: '', name: '', code: '' });
            fetchNumbers();
        } catch (error: any) {
            toast.error(error.message || "Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Phone Numbers</h1>
                        <p className="text-muted-foreground">Manage your verified WhatsApp business numbers.</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Number
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Phone Number</DialogTitle>
                                <DialogDescription>
                                    Verify a new phone number to use with the WhatsApp API.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                {/* Step 1: Input Details */}
                                {verifyStep === 1 && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input
                                                placeholder="e.g. Acme Support"
                                                value={newNumber.name}
                                                onChange={e => setNewNumber({ ...newNumber, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="+1 555 123 4567"
                                                    value={newNumber.phone}
                                                    onChange={e => setNewNumber({ ...newNumber, phone: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">Include country code (e.g. +1)</p>
                                        </div>
                                    </>
                                )}

                                {/* Step 2: OTP */}
                                {verifyStep === 2 && (
                                    <div className="space-y-4 text-center">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Verify your number</h3>
                                            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {newNumber.phone}</p>
                                        </div>
                                        <div className="flex justify-center">
                                            <Input
                                                className="text-center text-2xl tracking-widest w-48 font-mono"
                                                placeholder="000 000"
                                                maxLength={6}
                                                value={newNumber.code}
                                                onChange={e => setNewNumber({ ...newNumber, code: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Mock OTP is <strong>123456</strong></p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                {verifyStep === 1 ? (
                                    <Button onClick={handleSendOTP} disabled={verifying}>
                                        {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Send Verification Code
                                    </Button>
                                ) : (
                                    <div className="flex w-full justify-between gap-2">
                                        <Button variant="ghost" onClick={() => setVerifyStep(1)}>Back</Button>
                                        <Button onClick={handleVerifyOTP} disabled={verifying}>
                                            {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Verify
                                        </Button>
                                    </div>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Quality Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {numbers.map((num) => (
                                    <TableRow key={num.id}>
                                        <TableCell className="font-medium">{num.verified_name}</TableCell>
                                        <TableCell>{num.display_phone_number}</TableCell>
                                        <TableCell>
                                            <Badge variant={num.quality_rating === 'GREEN' ? 'default' : 'destructive'} className="bg-green-600 hover:bg-green-700">
                                                {num.quality_rating}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {num.status === 'VERIFIED' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                                {num.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Manage</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
