import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Calculator, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {

  const stats = [
    {
      title: "Total Project Cost",
      value: "EGP 245,000",
      icon: DollarSign,
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Total Budget",
      value: "EGP 300,000",
      icon: Calculator,
      trend: "82% used",
      trendUp: false
    },
    {
      title: "Active Units",
      value: "8",
      icon: Building2,
      trend: "3 over budget",
      trendUp: false
    },
    {
      title: "Partners",
      value: "3",
      icon: Users,
      trend: "All active",
      trendUp: true
    }
  ];

  const alerts = [
    { message: "Aswan A1 is 95% over budget", severity: "high" },
    { message: "Kitchen materials low in stock", severity: "medium" },
    { message: "Labor costs increased by 15%", severity: "low" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Construction Cost Tracker</h1>
              <p className="text-sm text-muted-foreground">Track your Airbnb construction costs</p>
            </div>
          </div>
          <Button 
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/1example/copy', '_blank')}
            variant="default"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Google Sheet Tool
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm text-muted-foreground">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerts & Notifications
              </CardTitle>
              <CardDescription>
                Important updates and budget warnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Add New Purchase
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Create New Unit
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Partner Settlement Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Budget vs Actual Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Google Sheets Integration */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-lg font-semibold">Google Sheets Construction Cost Tracker</h3>
            <p className="text-muted-foreground">
              Use our pre-built Google Sheets template to track construction costs, purchases, and partner settlements. 
              Click the button above to copy the template to your Google Drive and start tracking immediately.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Cost Tracking</h4>
                <p className="text-sm text-muted-foreground">Track all expenses by category and unit</p>
              </div>
              <div className="text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Unit Management</h4>
                <p className="text-sm text-muted-foreground">Organize costs by individual units</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Partner Settlement</h4>
                <p className="text-sm text-muted-foreground">Track partner contributions and balances</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;