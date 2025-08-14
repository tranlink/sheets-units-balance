import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
  Tooltip,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  LineChartIcon,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from 'lucide-react';
import { getUnitCosts, getCategorySpending, type UnitCostData, type CategorySpendingData } from '@/lib/database';
import { Purchase, Partner, Unit } from '@/types/construction';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

interface AnalyticsTabProps {
  projectId: string;
  purchases: Purchase[];
  partners: Partner[];
  units: Unit[];
  totalBudget: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

export function AnalyticsTab({ projectId, purchases, partners, units, totalBudget }: AnalyticsTabProps) {
  const [unitCosts, setUnitCosts] = useState<UnitCostData[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpendingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const [unitCostData, categorySpendingData] = await Promise.all([
          getUnitCosts(projectId),
          getCategorySpending(projectId)
        ]);
        
        setUnitCosts(unitCostData);
        setCategorySpending(categorySpendingData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: 'Error Loading Analytics',
          description: 'Failed to load analytics data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [projectId, toast]);

  // Filter purchases based on time range
  const getFilteredPurchases = () => {
    if (timeRange === 'all') return purchases;
    
    const now = new Date();
    const monthsBack = parseInt(timeRange);
    const cutoffDate = subMonths(now, monthsBack);
    
    return purchases.filter(purchase => 
      parseISO(purchase.date) >= cutoffDate
    );
  };

  const filteredPurchases = getFilteredPurchases();

  // Calculate key metrics
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const totalPurchases = filteredPurchases.length;
  const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate monthly trends
  const getMonthlyTrends = () => {
    const trends: { [key: string]: { month: string; spending: number; purchases: number } } = {};
    
    filteredPurchases.forEach(purchase => {
      const date = parseISO(purchase.date);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM yyyy');
      
      if (!trends[monthKey]) {
        trends[monthKey] = { month: monthLabel, spending: 0, purchases: 0 };
      }
      
      trends[monthKey].spending += purchase.totalCost;
      trends[monthKey].purchases += 1;
    });
    
    return Object.values(trends).sort((a, b) => a.month.localeCompare(b.month));
  };

  const monthlyTrends = getMonthlyTrends();

  // Calculate partner spending share
  const getPartnerSpendingData = () => {
    const partnerSpending = partners.map(partner => {
      const partnerPurchases = filteredPurchases.filter(p => p.partner === partner.name);
      const totalSpent = partnerPurchases.reduce((sum, p) => sum + p.totalCost, 0);
      const purchaseCount = partnerPurchases.length;
      
      return {
        id: partner.id,
        name: partner.name,
        totalSpent,
        purchaseCount,
        percentage: 0 // Will be calculated below
      };
    }).filter(partner => partner.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Add "Unassigned" for purchases without partner
    const unassignedPurchases = filteredPurchases.filter(p => !p.partner);
    const unassignedSpent = unassignedPurchases.reduce((sum, p) => sum + p.totalCost, 0);
    
    // Calculate total spending for percentage calculation
    const allSpending = partnerSpending.reduce((sum, p) => sum + p.totalSpent, 0) + unassignedSpent;
    
    // Recalculate percentages
    partnerSpending.forEach(partner => {
      partner.percentage = allSpending > 0 ? (partner.totalSpent / allSpending * 100) : 0;
    });
    
    if (unassignedSpent > 0) {
      partnerSpending.push({
        id: 'unassigned',
        name: 'Unassigned',
        totalSpent: unassignedSpent,
        purchaseCount: unassignedPurchases.length,
        percentage: allSpending > 0 ? (unassignedSpent / allSpending * 100) : 0
      });
    }

    return partnerSpending;
  };

  const partnerSpendingData = getPartnerSpendingData();

  // Calculate category insights
  const getCategoryInsights = () => {
    const insights: { [key: string]: { 
      spending: number; 
      purchases: number; 
      avgPurchase: number;
      trend: 'up' | 'down' | 'stable';
    } } = {};
    
    filteredPurchases.forEach(purchase => {
      if (!insights[purchase.category]) {
        insights[purchase.category] = { 
          spending: 0, 
          purchases: 0, 
          avgPurchase: 0,
          trend: 'stable'
        };
      }
      
      insights[purchase.category].spending += purchase.totalCost;
      insights[purchase.category].purchases += 1;
    });
    
    Object.keys(insights).forEach(category => {
      const data = insights[category];
      data.avgPurchase = data.purchases > 0 ? data.spending / data.purchases : 0;
      data.trend = data.spending > averagePurchase ? 'up' : 'down';
    });
    
    return Object.entries(insights)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.spending - a.spending);
  };

  const categoryInsights = getCategoryInsights();

  // Calculate recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    if (budgetUsed > 90) {
      recommendations.push({
        type: 'warning',
        title: 'Budget Alert',
        description: `You've used ${budgetUsed.toFixed(1)}% of your total budget. Consider reviewing upcoming expenses.`,
        action: 'Review Budget'
      });
    }
    
    const topCategory = categoryInsights[0];
    if (topCategory && topCategory.spending > totalSpent * 0.4) {
      recommendations.push({
        type: 'info',
        title: 'Category Concentration',
        description: `${topCategory.category} accounts for ${((topCategory.spending / totalSpent) * 100).toFixed(1)}% of spending.`,
        action: 'Analyze Category'
      });
    }
    
    if (totalPurchases > 0 && averagePurchase > 10000) {
      recommendations.push({
        type: 'tip',
        title: 'Large Purchase Pattern',
        description: `Your average purchase is ${formatCurrency(averagePurchase)}. Consider bulk purchasing for better deals.`,
        action: 'Optimize Purchases'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  const exportAnalytics = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics report is being prepared for download.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Project Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your project spending</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1">Last Month</SelectItem>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  {budgetUsed.toFixed(1)}% of budget
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">{totalPurchases}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {timeRange === 'all' ? 'All time' : `Last ${timeRange} month(s)`}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Purchase</p>
                <p className="text-2xl font-bold">{formatCurrency(averagePurchase)}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                  Per transaction
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Usage</p>
                <p className="text-2xl font-bold">{budgetUsed.toFixed(1)}%</p>
                <Progress value={Math.min(budgetUsed, 100)} className="w-full mt-2 h-2" />
              </div>
              <PieChartIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Spending Share */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner Spending Share
          </CardTitle>
          <CardDescription>
            Distribution of spending across partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerSpendingData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerSpendingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalSpent"
                    >
                      {partnerSpendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {partnerSpendingData.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {partner.purchaseCount} purchases
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(partner.totalSpent)}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No partner spending data available</p>
              <p className="text-sm">Assign partners to purchases to see spending distribution</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered insights to optimize your project spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Alert key={index} className={rec.type === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>{rec.title}</strong>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {rec.action}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Spending */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Spending distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    spending: {
                      label: "Spending",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryInsights.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [formatCurrency(value as number), "Spending"]}
                        />} 
                      />
                      <Bar dataKey="spending" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Purchase Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Frequency</CardTitle>
                <CardDescription>Number of purchases by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    purchases: {
                      label: "Purchases",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryInsights.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [value, "Purchases"]}
                        />} 
                      />
                      <Bar dataKey="purchases" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {monthlyTrends.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
                <CardDescription>Spending patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    spending: {
                      label: "Spending",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          formatter={(value) => [formatCurrency(value as number), 'Spending']}
                        />} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No trend data available for the selected time range</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unit Performance</CardTitle>
              <CardDescription>Budget vs actual spending by unit</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  budget: {
                    label: "Budget",
                    color: "hsl(var(--chart-2))",
                  },
                  actual: {
                    label: "Actual",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unitCosts.map(unit => ({
                      name: unit.unit_name.length > 15 ? unit.unit_name.substring(0, 15) + '...' : unit.unit_name,
                      budget: unit.budget,
                      actual: unit.actual_cost,
                      percentage: unit.cost_percentage
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent 
                        formatter={(value, name) => [
                          formatCurrency(value as number), 
                          name === 'budget' ? 'Budget' : 'Actual Cost'
                        ]}
                      />} 
                    />
                    <Bar dataKey="budget" fill="#82ca9d" name="budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#8884d8" name="actual" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}