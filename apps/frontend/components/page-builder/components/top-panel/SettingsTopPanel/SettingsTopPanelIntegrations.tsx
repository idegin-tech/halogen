import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Database, CreditCard, MessagesSquare, KeyRound, ShoppingCartIcon } from 'lucide-react'

export default function SettingsTopPanelIntegrations() {
    return (
        <div className="p-4 space-y-4 select-none">
            <Card>
                <CardHeader>
                    <CardTitle>UI Framework Integrations</CardTitle>
                    <CardDescription>Configure third-party UI frameworks and libraries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-cyan-50 dark:bg-cyan-950 p-1.5 rounded-md">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 6.04l-7.2 12.75h2.88l1.8-3.15h5.04l1.8 3.15h2.88L12 6.04zm0 3.57l2.07 3.6H9.93l2.07-3.6z" fill="currentColor" className="text-cyan-500" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Tailwind CSS</p>
                                <p className="text-xs text-muted-foreground">Utility-first CSS framework</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Enabled</Badge>
                            <Switch id="tailwind" defaultChecked />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-amber-50 dark:bg-amber-950 p-1.5 rounded-md">
                                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                    <path d="M14.31 9.903L8.533 20.8H6.95l5.777-10.897-2.963-4.853h1.584z" />
                                    <path d="M15.548 5.05L9.771 15.947H8.186l5.777-10.898L15.548 5.05z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Animation On Scroll (AOS)</p>
                                <p className="text-xs text-muted-foreground">Animate elements as you scroll</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="aos" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-violet-50 dark:bg-violet-950 p-1.5 rounded-md">
                                <svg className="h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Framer Motion</p>
                                <p className="text-xs text-muted-foreground">Production-ready animation library</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="framer" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Business Integrations</CardTitle>
                    <CardDescription>Connect your site with third-party business services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 dark:bg-blue-950 p-1.5 rounded-md">
                                <Database className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">CMS Integration</p>
                                <p className="text-xs text-muted-foreground">Headless CMS for content management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="cms" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-50 dark:bg-emerald-950 p-1.5 rounded-md">
                                <KeyRound className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-medium">Authentication</p>
                                <p className="text-xs text-muted-foreground">User authentication and authorization</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="auth" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-pink-50 dark:bg-pink-950 p-1.5 rounded-md">
                                <CreditCard className="h-5 w-5 text-pink-500" />
                            </div>
                            <div>
                                <p className="font-medium">Payment Processing</p>
                                <p className="text-xs text-muted-foreground">Stripe and PayPal integrations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="payment" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-yellow-50 dark:bg-yellow-950 p-1.5 rounded-md">
                                <ShoppingCartIcon className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="font-medium">eCommerce</p>
                                <p className="text-xs text-muted-foreground">
                                    Integrate with eCommerce platforms
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="payment" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="bg-rose-50 dark:bg-rose-950 p-1.5 rounded-md">
                                <MessagesSquare className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <p className="font-medium">Chat Bot</p>
                                <p className="text-xs text-muted-foreground">AI-powered customer support</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline">Disabled</Badge>
                            <Switch id="chatbot" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
