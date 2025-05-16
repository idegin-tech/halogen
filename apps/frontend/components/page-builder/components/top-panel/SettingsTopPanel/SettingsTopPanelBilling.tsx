'use client';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useBuilderContext } from '@/context/builder.context'
import { useMutation, useQuery } from '@/hooks/useApi'
import { toast } from 'sonner'
import { Loader2, CreditCard, ArrowUpCircle, Download, ChevronRight, CornerUpRight } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'pending' | 'failed';
    invoiceId?: string;
}

interface Plan {
    id: string;
    name: string;
    price: number;
    isCurrent: boolean;
    features: string[];
}

export default function SettingsTopPanelBilling() {
    const { state: { project } } = useBuilderContext();
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showFundWalletModal, setShowFundWalletModal] = useState(false);

    // Simulated data loading
    useEffect(() => {
        // In a real implementation, replace with actual API calls
        setTimeout(() => {
            setWalletBalance(500);
            setCurrentPlan({
                id: 'basic',
                name: 'Basic Plan',
                price: 9.99,
                isCurrent: true,
                features: ['1 website', '10 pages per site', 'Basic analytics', 'Community support']
            });

            setAvailablePlans([
                {
                    id: 'basic',
                    name: 'Basic Plan',
                    price: 9.99,
                    isCurrent: true,
                    features: ['1 website', '10 pages per site', 'Basic analytics', 'Community support']
                },
                {
                    id: 'pro',
                    name: 'Pro Plan',
                    price: 29.99,
                    isCurrent: false,
                    features: ['5 websites', 'Unlimited pages', 'Advanced analytics', 'Priority support', 'Custom domains']
                },
                {
                    id: 'enterprise',
                    name: 'Enterprise Plan',
                    price: 99.99,
                    isCurrent: false,
                    features: ['Unlimited websites', 'Unlimited pages', 'Advanced analytics', 'Dedicated support', 'Custom domains', 'White labeling']
                }
            ]);

            setTransactions([
                {
                    id: 'tx1',
                    date: '2025-05-15T10:30:00Z',
                    description: 'Monthly subscription - Basic Plan',
                    amount: 9.99,
                    type: 'debit',
                    status: 'completed',
                    invoiceId: 'INV-2025-001'
                },
                {
                    id: 'tx2',
                    date: '2025-05-10T14:22:00Z',
                    description: 'Wallet funding',
                    amount: 100,
                    type: 'credit',
                    status: 'completed',
                    invoiceId: 'INV-2025-002'
                },
                {
                    id: 'tx3',
                    date: '2025-04-15T10:30:00Z',
                    description: 'Monthly subscription - Basic Plan',
                    amount: 9.99,
                    type: 'debit',
                    status: 'completed',
                    invoiceId: 'INV-2025-003'
                },
                {
                    id: 'tx4',
                    date: '2025-04-05T09:15:00Z',
                    description: 'Wallet funding',
                    amount: 50,
                    type: 'credit',
                    status: 'completed',
                    invoiceId: 'INV-2025-004'
                },
                {
                    id: 'tx5',
                    date: '2025-03-15T10:30:00Z',
                    description: 'Monthly subscription - Basic Plan',
                    amount: 9.99,
                    type: 'debit',
                    status: 'completed',
                    invoiceId: 'INV-2025-005'
                }
            ]);

            setIsLoading(false);
        }, 1000);
    }, []);

    const handleUpgrade = () => {
        setShowUpgradeModal(true);
    };

    const handleFundWallet = () => {
        setShowFundWalletModal(true);
    };

    const handleViewInvoice = (invoiceId: string) => {
        toast.info(`Viewing invoice ${invoiceId}. In a real implementation, this would open the invoice.`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg text-muted-foreground">Loading billing information...</span>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 grid grid-cols-1">
            <div className="grid gap-2">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8">
                        <div className="w-full h-full rounded-full bg-primary/10"></div>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <CreditCard className="mr-2" /> Current Plan
                        </CardTitle>
                        <CardDescription>Your active subscription plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-primary flex items-baseline">
                                {currentPlan?.name}
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">Active</Badge>
                            </h3>
                            <p className="text-muted-foreground mt-1">${currentPlan?.price}/month</p>
                        </div>
                        <ul className="space-y-2">
                            {currentPlan?.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                    <CheckIcon className="h-5 w-5 text-primary mr-2" /> {feature}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleUpgrade} className="w-full">
                            Upgrade Plan <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8">
                        <div className="w-full h-full rounded-full bg-green-500/10"></div>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <WalletIcon className="mr-2" /> Wallet Balance
                        </CardTitle>
                        <CardDescription>Your available balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <h3 className="text-3xl font-bold text-green-600">${walletBalance.toFixed(2)}</h3>
                            <p className="text-muted-foreground mt-1">Available for services</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="font-medium text-sm">Upcoming charges</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Next billing date: {format(new Date(2025, 5, 15), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Amount: ${currentPlan?.price}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleFundWallet} className="w-full" variant="outline">
                            Fund Wallet <ArrowUpCircle className="ml-1 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Recent payments and charges</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className={transaction.type === 'credit' ? 'text-green-600 font-medium' : ''}>
                                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                transaction.status === 'completed' ? 'default' :
                                                    transaction.status === 'pending' ? 'secondary' : 'destructive'
                                            }
                                            className={
                                                transaction.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                                                    transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-700' : ''
                                            }
                                        >
                                            {transaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {transaction.invoiceId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewInvoice(transaction.invoiceId!)}
                                                className="h-8 px-2"
                                            >
                                                <Download className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <Button variant="outline" size="sm" className="gap-1">
                        View All Transactions <CornerUpRight className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

// CheckIcon component for feature list
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

// WalletIcon component
function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
    )
}
