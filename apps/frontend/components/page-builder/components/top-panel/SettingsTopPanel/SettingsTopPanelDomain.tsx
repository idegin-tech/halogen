'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check, Copy, Globe, Loader2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const MOCK_IP_ADDRESS = '123.45.67.89';

type DomainStatus = 'initial' | 'pending-dns' | 'propagating' | 'connected';

type DnsRecord = {
    type: string;
    host: string;
    value: string;
    ttl: string;
};

const dnsRecords: DnsRecord[] = [
    {
        type: 'A',
        host: '@',
        value: MOCK_IP_ADDRESS,
        ttl: '3600'
    },
    {
        type: 'A',
        host: 'www',
        value: MOCK_IP_ADDRESS,
        ttl: '3600'
    }
];

export default function SettingsTopPanelDomain() {
    const [domain, setDomain] = useState('');
    const [status, setStatus] = useState<DomainStatus>('initial');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDomainSubmit = async () => {
        if (!domain || isSubmitting) return;
        
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setStatus('pending-dns');
    };

    const handleDnsVerification = async () => {
        setStatus('propagating');
        await new Promise(resolve => setTimeout(resolve, 5000));
        setStatus('connected');
    };

    const handleEdit = () => {
        setStatus('initial');
        setDomain('');
    };

    const handleDelete = async () => {
        setStatus('initial');
        setDomain('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="space-y-6 p-6 select-none">
            <div className="flex flex-col gap-6">
                {status === 'initial' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Domain</CardTitle>
                            <CardDescription>
                                Connect your custom domain to your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Enter your domain (e.g., example.com)"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <Button
                                    onClick={handleDomainSubmit}
                                    disabled={!domain || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Globe className="h-4 w-4 mr-2" />
                                    )}
                                    Add Domain
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {status === 'pending-dns' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Configure DNS Settings
                            </CardTitle>
                            <CardDescription>
                                Add the following DNS records to your domain provider
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Important</AlertTitle>
                                <AlertDescription>
                                    These changes may take up to 24 hours to propagate globally
                                </AlertDescription>
                            </Alert>

                            <div className="rounded-lg border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Record Type</TableHead>
                                            <TableHead>Host</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>TTL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dnsRecords.map((record, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="group relative">
                                                    <span>{record.type}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(record.type)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="group relative min-w-16">
                                                    <span>{record.host}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(record.host)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-mono group relative">
                                                    <span>{record.value}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(record.value)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="group relative">
                                                    <span>{record.ttl}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(record.ttl)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                                <h4 className="text-sm font-medium">Common DNS Providers</h4>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>• {`Go54 (Formally WhoGoHost)`}</p>
                                    <p>• Cloudflare</p>
                                    <p>• GoDaddy</p>
                                    <p>• Namecheap</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleDnsVerification} className="w-full">
                                <Check className="h-4 w-4 mr-2" />
                                I've Updated DNS Settings
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {status === 'propagating' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                DNS Propagation in Progress
                            </CardTitle>
                            <CardDescription>
                                This process can take up to 24 hours
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-progress" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    We're verifying your DNS settings. This usually takes a few hours,
                                    but can take up to 24 hours to complete.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {status === 'connected' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    Domain Connected
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleEdit}>
                                            Edit Domain
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="text-destructive"
                                        >
                                            Delete Domain
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription>
                                Your domain is successfully connected
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{domain}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="text-green-500">Live</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
