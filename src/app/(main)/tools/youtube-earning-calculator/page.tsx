'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign, TrendingUp, Calendar, Info } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function YoutubeEarningCalculatorPage() {
    const [dailyViews, setDailyViews] = useState<number>(10000);
    const [cpmMin, setCpmMin] = useState<number>(0.25);
    const [cpmMax, setCpmMax] = useState<number>(4.00);

    const [earnings, setEarnings] = useState({
        daily: { low: 0, high: 0 },
        monthly: { low: 0, high: 0 },
        yearly: { low: 0, high: 0 },
    });

    useEffect(() => {
        const calculateEarnings = () => {
            const viewsPerThousand = dailyViews / 1000;

            const dailyLow = viewsPerThousand * cpmMin;
            const dailyHigh = viewsPerThousand * cpmMax;

            setEarnings({
                daily: { low: dailyLow, high: dailyHigh },
                monthly: { low: dailyLow * 30, high: dailyHigh * 30 },
                yearly: { low: dailyLow * 365, high: dailyHigh * 365 },
            });
        };

        calculateEarnings();
    }, [dailyViews, cpmMin, cpmMax]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Breadcrumb className="flex justify-center mb-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/tools">Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/tools/text-ai">Text & AI</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Earning Calculator</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Earning Calculator</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Estimate your potential YouTube revenue based on daily views and CPM rates.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Inputs Section */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Calculator Settings
                        </CardTitle>
                        <CardDescription>Adjust views and CPM to see potential earnings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="views">Daily Video Views</Label>
                                <Input
                                    id="views"
                                    type="number"
                                    value={dailyViews}
                                    onChange={(e) => setDailyViews(Number(e.target.value))}
                                    className="w-24 h-8 text-right"
                                />
                            </div>
                            <Slider
                                value={[dailyViews]}
                                min={100}
                                max={1000000}
                                step={100}
                                onValueChange={(val) => setDailyViews(val[0])}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground text-right">{dailyViews.toLocaleString()} views</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="cpm-min">CPM Range ($)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="cpm-min"
                                        type="number"
                                        value={cpmMin}
                                        onChange={(e) => setCpmMin(Number(e.target.value))}
                                        className="w-16 h-8 text-right"
                                        step={0.1}
                                    />
                                    <span>-</span>
                                    <Input
                                        id="cpm-max"
                                        type="number"
                                        value={cpmMax}
                                        onChange={(e) => setCpmMax(Number(e.target.value))}
                                        className="w-16 h-8 text-right"
                                        step={0.1}
                                    />
                                </div>
                            </div>
                            <Slider
                                value={[cpmMin, cpmMax]}
                                min={0.1}
                                max={20}
                                step={0.1}
                                onValueChange={(val) => {
                                    setCpmMin(val[0]);
                                    setCpmMax(val[1]);
                                }}
                                className="py-4"
                            />
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                                <Info className="w-3 h-3" />
                                <span>CPM = Cost Per 1,000 Views. Average is $0.25 - $4.00.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Daily Earnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(earnings.daily.low)} - {formatCurrency(earnings.daily.high)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Monthly Earnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(earnings.monthly.low)} - {formatCurrency(earnings.monthly.high)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Yearly Earnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(earnings.yearly.low)} - {formatCurrency(earnings.yearly.high)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estimated Earnings Breakdown</CardTitle>
                            <CardDescription>Based on your daily views and selected CPM range.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Daily Views</span>
                                        <span className="font-bold">{dailyViews.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Min. Monthly</span>
                                            <span className="font-bold">{formatCurrency(earnings.monthly.low)}</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Max. Monthly</span>
                                            <span className="font-bold">{formatCurrency(earnings.monthly.high)}</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                    <p>
                                        <strong>Note:</strong> These figures are estimates. Actual earnings vary based on video category, viewer location, ad engagement, and YouTube's revenue share (usually 55% to the creator).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
