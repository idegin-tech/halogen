'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Check, Copy, ExternalLink, Globe, Loader2, MoreVertical, RefreshCw, Shield, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useProjectContext } from '@/context/project.context';
import { useMutation, useQuery } from '@/hooks/useApi';
import { Badge } from '@/components/ui/badge';
import { DomainData, DomainStatus, appConfig } from '@halogen/common';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});


const getDomainUiStatus = (domainData?: DomainData | null): 'initial' | 'pending-dns' | 'propagating' | 'connected' | 'failed' => {
    if (!domainData) return 'initial';

    switch (domainData.status) {
        case DomainStatus.PENDING:
            return 'initial';
        case DomainStatus.PENDING_DNS:
            return 'pending-dns';
        case DomainStatus.PROPAGATING:
            return 'propagating';
        case DomainStatus.ACTIVE:
            return 'connected';
        case DomainStatus.FAILED:
            return 'failed';
        case DomainStatus.SUSPENDED:
            return 'failed';
        default:
            return 'initial';
    }
};

interface DnsRecord {
    type: string;
    host: string;
    value: string;
    ttl: string;
}

export default function SettingsTopPanelDomain() {
    const { state: { project } } = useProjectContext();
    const projectId = project?._id;

    const [domain, setDomain] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [verificationToken, setVerificationToken] = useState<string | null>(null);    const [serverIP, setServerIP] = useState<string>(appConfig.ServerIPAddress); 
      const fetchDomainVerificationToken = async (domainId: string) => {
        if (!domainId) return null;

        try {
            const response = await api.get(`/domains/verify/${domainId}`);
            return response.data.payload?.verificationToken || null;
        } catch (error) {
            console.error('Error fetching verification token:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch verification token';
            toast.error(errorMessage);
            return null;
        }
    };

    const domainQuery = useQuery<DomainData | null>(
        projectId ? `/domains/primary/${projectId}` : '',
        {},
        [projectId],
        { enabled: !!projectId }
    );

    const domainMutation = useMutation('/domains');
    const verifyMutation = useMutation('/domains/check');
    const sslMutation = useMutation('/domains/ssl');

    const domainData = domainQuery.data as DomainData | null;
    const status = getDomainUiStatus(domainData);
    const needsSSL = status === 'connected' && !domainData?.sslIssuedAt;
    const hasDomain = !!domainData;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (domainData && (domainData.status === DomainStatus.PENDING_DNS || domainData.status === DomainStatus.PROPAGATING)) {
            interval = setInterval(() => {
                if (domainData._id) {
                    checkVerificationStatus(domainData._id);
                }
            }, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [domainData]);    const handleDomainSubmit = async () => {
        if (!domain || !projectId) return;

        try {
            const response = await api.post(`/domains/${projectId}`, { name: domain });
            const result = response.data.payload;

            if (result) {
                if (typeof result === 'object' && result !== null && 'verificationToken' in result) {
                    setVerificationToken(result.verificationToken as string);
                }
                domainQuery.refetch();
                setDomain('');
                toast.success('Domain added successfully');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add domain';
            toast.error(errorMessage);
        }
    };    const checkVerificationStatus = async (domainId: string) => {
        try {
            if (!verificationToken) {
                const token = await fetchDomainVerificationToken(domainId);
                if (token) {
                    setVerificationToken(token);
                }
            }

            // Using axios directly for the verification check
            console.log('Sending verification check with payload:', { domainId });
            await api.post('/domains/check', { domainId });
            domainQuery.refetch();
        } catch (error) {
            console.error('Failed to check verification status:', error);
            if (axios.isAxiosError(error)) {
                console.error('Request details:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data,
                    response: error.response?.data
                });
            }
            const errorMessage = error instanceof Error ? error.message : 'Failed to check verification status';
            toast.error(errorMessage);
        }
    };const handleDnsVerification = async () => {
        if (!domainData?._id) return;

        try {
            console.log('Sending DNS verification with payload:', { domainId: domainData._id });
            await api.post('/domains/check', { domainId: domainData._id });
            domainQuery.refetch();
            toast.success('Verification check initiated');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Request details:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data,
                    response: error.response?.data
                });
            }
            const errorMessage = error instanceof Error ? error.message : 'Failed to verify DNS settings';
            console.error('Domain verification error:', error);
            toast.error(errorMessage);
        }
    };const handleRequestSSL = async () => {
        if (!domainData?._id) return;

        try {
            await api.post('/domains/ssl', { domainId: domainData._id });
            domainQuery.refetch();
            toast.success('SSL certificate generation initiated');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate SSL certificate';
            console.error('SSL generation error:', error);
            toast.error(errorMessage);
        }
    };    const handleDelete = async () => {
        if (!domainData?._id) return;

        try {
            await api.delete(`/domains/domain/${domainData._id}`);
            setDeleteDialogOpen(false);
            domainQuery.refetch();
            toast.success('Domain deleted successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete domain';
            console.error('Domain deletion error:', error);
            toast.error(errorMessage);
        }
    };

    const getDnsRecords = useCallback((): DnsRecord[] => {
        const records: DnsRecord[] = [];

        if (domainData) {
            const ip = serverIP;

            records.push({
                type: 'A',
                host: '@',
                value: ip,
                ttl: '3600'
            });

            records.push({
                type: 'A',
                host: 'www',
                value: ip,
                ttl: '3600'
            });

            if (verificationToken || (domainData && domainData.verificationFailReason && domainData.status === DomainStatus.PENDING_DNS)) {
                records.push({
                    type: 'TXT',
                    host: '@',
                    value: verificationToken || 'halogen-domain-verification=token-not-available',
                    ttl: '3600'
                });
            }
        }

        return records;
    }, [domainData, verificationToken, serverIP]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    if (domainQuery.isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const dnsRecords = getDnsRecords();

    return (
        <div className="space-y-6 p-6 select-none">
            <div className="flex flex-col gap-6">
                {status === 'initial' && !hasDomain && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Custom Domain
                            </CardTitle>
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
                                    disabled={domainMutation.isLoading}
                                />
                                <Button
                                    onClick={handleDomainSubmit}
                                    disabled={!domain || domainMutation.isLoading || !projectId}
                                >
                                    {domainMutation.isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Globe className="h-4 w-4 mr-2" />
                                    )}
                                    Add Domain
                                </Button>
                            </div>
                            {/* @ts-ignore     */}
                            {domainData && domainData.status === DomainStatus.FAILED && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Domain Verification Failed</AlertTitle>
                                    <AlertDescription>
                                        {/* @ts-ignore     */}
                                        {domainData.verificationFailReason || "We couldn't verify your domain. Please check your DNS settings and try again."}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {status === 'initial' && hasDomain && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Domain Setup Required
                            </CardTitle>
                            <CardDescription>
                                Your domain {domainData?.name} needs to be configured
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Setup Required</AlertTitle>
                                <AlertDescription>
                                    To make your domain work, you need to configure DNS settings at your domain provider.
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleDnsVerification}>
                                Continue Domain Setup
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {status === 'pending-dns' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5" />
                                    Configure DNS Settings
                                </CardTitle>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    Pending Verification
                                </Badge>
                            </div>
                            <CardDescription>
                                Add the following DNS records to your domain provider
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Important</AlertTitle>
                                <AlertDescription>
                                    DNS changes may take up to 24 hours to propagate globally. Add a TXT record to verify domain ownership.
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
                                            <TableHead className="w-8"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dnsRecords.map((record, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Badge variant={record.type === 'TXT' ? 'secondary' : 'outline'}>
                                                        {record.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {record.host}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs max-w-64 truncate">
                                                    {record.value}
                                                </TableCell>
                                                <TableCell>{record.ttl}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => copyToClipboard(record.value)}
                                                        title="Copy Value"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
                                    <h4 className="text-sm font-medium">Common DNS Providers</h4>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>• Go54 (Formerly WhoGoHost)</p>
                                        <p>• Cloudflare</p>
                                        <p>• GoDaddy</p>
                                        <p>• Namecheap</p>
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
                                    <h4 className="text-sm font-medium">Need Help?</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Visit our documentation for step-by-step guides for popular domain providers.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                        View Guides
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-between">
                            <Button
                                variant="secondary"
                                onClick={() => domainQuery.refetch()}
                                disabled={verifyMutation.isLoading}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Status
                            </Button>
                            <Button
                                onClick={handleDnsVerification}
                                disabled={verifyMutation.isLoading}
                                className="sm:flex-grow-0"
                            >
                                {verifyMutation.isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Verify DNS Settings
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {status === 'propagating' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    DNS Propagation in Progress
                                </CardTitle>
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    Propagating
                                </Badge>
                            </div>
                            <CardDescription>
                                Your domain {domainData?.name} is being verified and configured
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{
                                            animation: 'progress 2s ease-in-out infinite alternate',
                                            width: '0%'
                                        }}
                                    />
                                </div>
                                <style jsx>{`
                                    @keyframes progress {
                                        0% { width: 0%; }
                                        25% { width: 35%; }
                                        50% { width: 60%; }
                                        75% { width: 85%; }
                                        100% { width: 100%; }
                                    }
                                `}</style>
                                <p className="text-sm text-muted-foreground">
                                    We're verifying your DNS settings and setting up SSL certificates.
                                    This process is automatic and usually takes 5-10 minutes, but can take longer.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="flex flex-col p-3 border rounded-lg">
                                        <span className="text-xs text-muted-foreground">Domain Verification</span>
                                        <span className="flex items-center mt-1">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-amber-500" />
                                            <span className="text-sm font-medium">In Progress</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-col p-3 border rounded-lg">
                                        <span className="text-xs text-muted-foreground">SSL Certificate</span>
                                        <span className="flex items-center mt-1">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-amber-500" />
                                            <span className="text-sm font-medium">Pending</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => domainQuery.refetch()}
                                disabled={domainQuery.isLoading}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Status
                            </Button>
                        </CardFooter>
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
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Active
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => window.open(`https://${domainData?.name}`, '_blank')}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Visit Site
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                                                <X className="h-4 w-4 mr-2" />
                                                Delete Domain
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardDescription>
                                Your domain is successfully connected and {needsSSL ? "needs SSL setup" : "secured with SSL"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{domainData?.name}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className={needsSSL ? "text-amber-500 flex items-center" : "text-green-500 flex items-center"}>
                                    <Shield className="h-4 w-4 mr-1" />
                                    {needsSSL ? "http://" : "https://"}{domainData?.name}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="flex flex-col p-3 border rounded-lg">
                                    <span className="text-xs text-muted-foreground">DNS Status</span>
                                    <span className="flex items-center mt-1">
                                        <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                                        <span className="text-sm font-medium">Verified</span>
                                    </span>
                                </div>
                                <div className="flex flex-col p-3 border rounded-lg">
                                    <span className="text-xs text-muted-foreground">SSL Certificate</span>
                                    <span className="flex items-center mt-1">
                                        {needsSSL ? (
                                            <>
                                                <X className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                                                <span className="text-sm font-medium">Not Configured</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                                                <span className="text-sm font-medium">Active</span>
                                            </>
                                        )}
                                    </span>
                                    {domainData?.sslExpiresAt && (
                                        <span className="text-xs text-muted-foreground mt-1">
                                            Expires: {new Date(domainData.sslExpiresAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {needsSSL && (
                                <Alert className="mt-2 bg-amber-50 text-amber-800 border-amber-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>SSL Certificate Required</AlertTitle>
                                    <AlertDescription className="flex flex-col gap-3">
                                        <p>Your domain is verified but needs an SSL certificate to enable HTTPS.</p>
                                        <Button
                                            onClick={handleRequestSSL}
                                            size="sm"
                                            disabled={sslMutation.isLoading}
                                            className="w-fit"
                                        >
                                            {sslMutation.isLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                            ) : (
                                                <Shield className="h-3.5 w-3.5 mr-1.5" />
                                            )}
                                            Generate SSL Certificate
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {status === 'failed' && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <X className="h-5 w-5" />
                                    Domain Verification Failed
                                </CardTitle>
                                <Badge variant="destructive">
                                    Failed
                                </Badge>
                            </div>
                            <CardDescription>
                                We couldn't verify your domain ownership
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Verification Error</AlertTitle>
                                <AlertDescription>
                                    {domainData?.verificationFailReason ||
                                        "We couldn't verify the DNS records for your domain. Please check your DNS configuration and try again."}
                                </AlertDescription>
                            </Alert>

                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                <h4 className="text-sm font-medium mb-2">Troubleshooting Steps:</h4>
                                <ul className="text-sm space-y-1 list-disc pl-5">
                                    <li>Verify that you've added all required DNS records</li>
                                    <li>Check for typos in your DNS configuration</li>
                                    <li>Wait 24-48 hours for DNS propagation</li>
                                    <li>Try using a tool like <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">dnschecker.org</a> to verify your DNS records</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove Domain
                            </Button>
                            <Button
                                onClick={handleDnsVerification}
                                disabled={verifyMutation.isLoading}
                            >
                                {verifyMutation.isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Try Again
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {status === 'initial' && !hasDomain && (
                    <Card className="bg-muted/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <Globe className="h-12 w-12 text-muted-foreground/60" />
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">Custom Domain Benefits</h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        A custom domain creates a professional appearance for your website and helps with branding and marketing efforts.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Domain</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the domain {domainData?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={domainMutation.isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={domainMutation.isLoading}
                        >
                            {domainMutation.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <X className="h-4 w-4 mr-2" />
                            )}
                            Delete Domain
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
