import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Calculator, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Plus,
  BarChart3,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Purchase, Unit, Partner, BudgetCategory, Alert } from '@/types/construction';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { UnitForm } from '@/components/forms/UnitForm';
import { PurchasesTable } from '@/components/tables/PurchasesTable';
import { UnitsTable } from '@/components/tables/UnitsTable';
import { BudgetChart } from '@/components/charts/BudgetChart';

export default function ConstructionTracker() {
  const { toast } = useToast();
  
  // State management
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);

  // Sample data initialization
  useEffect(() => {
    // Initialize with sample partners
    setPartners([
      {
        id: '1',
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '+20123456789',
        totalContribution: 100000,
        totalSpent: 85000,
        balance: 15000,
        status: 'Active'
      },
      {
        id: '2',
        name: 'Sarah Mohamed',
        email: 'sarah@example.com',
        phone: '+20123456790',
        totalContribution: 150000,
        totalSpent: 120000,
        balance: 30000,
        status: 'Active'
      }
    ]);

    // Initialize with sample units
    setUnits([
      {
        id: '1',
        name: 'Aswan A1',
        type: '2 Bedroom',
        budget: 80000,
        actualCost: 76000,
        status: 'In Progress',
        partner: '1'
      },
      {
        id: '2',
        name: 'Cairo B2',
        type: 'Studio',
        budget: 50000,
        actualCost: 47500,
        status: 'Completed',
        partner: '2'
      }
    ]);

    // Initialize with sample purchases
    setPurchases([
      {
        id: '1',
        date: '2024-08-10',
        category: 'Bathroom',
        description: 'Ceramic tiles for bathroom flooring',
        quantity: 20,
        unitPrice: 250,
        totalCost: 5000,
        unit: '1',
        partner: '1'
      },
      {
        id: '2',
        date: '2024-08-12',
        category: 'Plumbing',
        description: 'Bathroom fixtures installation',
        quantity: 1,
        unitPrice: 3500,
        totalCost: 3500,
        unit: '2',
        partner: '2'
      }
    ]);

    // Initialize alerts
    setAlerts([
      {
        id: '1',
        message: 'Aswan A1 is approaching budget limit (95% used)',
        type: 'warning',
        severity: 'high',
        date: '2024-08-13'
      },
      {
        id: '2',
        message: 'Monthly spending increased by 15%',
        type: 'info',
        severity: 'medium',
        date: '2024-08-12'
      }
    ]);
  }, []);

  // Calculate statistics
  const totalBudget = units.reduce((sum, unit) => sum + unit.budget, 0);
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const activeUnits = units.filter(unit => unit.status === 'In Progress').length;
  const completedUnits = units.filter(unit => unit.status === 'Completed').length;

  // Update unit costs when purchases change
  useEffect(() => {
    setUnits(prevUnits => 
      prevUnits.map(unit => ({
        ...unit,
        actualCost: purchases
          .filter(p => p.unit === unit.id)
          .reduce((sum, p) => sum + p.totalCost, 0)
      }))
    );
  }, [purchases]);

  // Budget categories calculation
  const budgetCategories: BudgetCategory[] = [
    'Plumbing', 'Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Flooring', 
    'Electrical', 'HVAC', 'Roofing', 'Painting', 'Doors & Windows', 'Insulation', 
    'Foundation', 'Exterior', 'Other'
  ].map(category => {
    const spentAmount = purchases
      .filter(p => p.category === category)
      .reduce((sum, p) => sum + p.totalCost, 0);
    const budgetAmount = totalBudget * (
      category === 'Bathroom' ? 0.15 : 
      category === 'Kitchen' ? 0.15 : 
      category === 'Bedroom' ? 0.12 :
      category === 'Plumbing' ? 0.10 :
      category === 'Electrical' ? 0.08 :
      category === 'Flooring' ? 0.10 :
      0.05
    );
    
    return {
      id: category.toLowerCase(),
      name: category,
      budgetAmount,
      spentAmount,
      remaining: budgetAmount - spentAmount
    };
  });

  // Handlers
  const handleAddPurchase = (purchaseData: Omit<Purchase, 'id' | 'totalCost'> & { units: string[], distributeEvenly: boolean }) => {
    const totalCost = purchaseData.quantity * purchaseData.unitPrice;
    
    if (purchaseData.distributeEvenly && purchaseData.units.length > 1) {
      // Split into multiple purchases, one per unit
      const quantityPerUnit = purchaseData.quantity / purchaseData.units.length;
      const costPerUnit = totalCost / purchaseData.units.length;
      
      const newPurchases: Purchase[] = purchaseData.units.map(unitId => ({
        id: `${Date.now()}-${unitId}`,
        date: purchaseData.date,
        category: purchaseData.category,
        description: `${purchaseData.description} (${quantityPerUnit} units)`,
        quantity: quantityPerUnit,
        unitPrice: purchaseData.unitPrice,
        totalCost: costPerUnit,
        unit: unitId,
        partner: purchaseData.partner,
        receipt: purchaseData.receipt,
      }));
      
      setPurchases(prev => [...newPurchases, ...prev]);
      
      toast({
        title: 'Purchase Added',
        description: `Added ${purchaseData.description} to ${purchaseData.units.length} units for EGP ${totalCost.toLocaleString()} total`,
      });
    } else {
      // Create single purchase for first selected unit or general
      const newPurchase: Purchase = {
        id: Date.now().toString(),
        date: purchaseData.date,
        category: purchaseData.category,
        description: purchaseData.description,
        quantity: purchaseData.quantity,
        unitPrice: purchaseData.unitPrice,
        totalCost: totalCost,
        unit: purchaseData.units[0],
        partner: purchaseData.partner,
        receipt: purchaseData.receipt,
      };
      
      setPurchases(prev => [newPurchase, ...prev]);
      
      toast({
        title: 'Purchase Added',
        description: `Added ${purchaseData.description} for EGP ${totalCost.toLocaleString()}`,
      });
    }
  };

  const handleAddUnit = (unitData: Omit<Unit, 'id' | 'actualCost'>) => {
    const newUnit: Unit = {
      ...unitData,
      id: Date.now().toString(),
      actualCost: 0
    };
    
    setUnits(prev => [...prev, newUnit]);
    toast({
      title: 'Unit Created',
      description: `Created new unit: ${unitData.name}`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: "Total Budget",
      value: formatCurrency(totalBudget),
      icon: Calculator,
      trend: `${activeUnits + completedUnits} units`,
      trendUp: true
    },
    {
      title: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      trend: `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget`,
      trendUp: totalSpent / totalBudget < 0.9
    },
    {
      title: "Active Units",
      value: activeUnits.toString(),
      icon: Building2,
      trend: `${completedUnits} completed`,
      trendUp: true
    },
    {
      title: "Partners",
      value: partners.length.toString(),
      icon: Users,
      trend: `${partners.filter(p => p.status === 'Active').length} active`,
      trendUp: true
    }
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
          <div className="flex gap-2">
            <Button onClick={() => setShowPurchaseForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Purchase
            </Button>
            <Button onClick={() => setShowUnitForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-8">
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
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">{alert.message}</span>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PurchasesTable 
                purchases={purchases.slice(0, 5)} 
                units={units} 
                partners={partners}
              />
              <UnitsTable units={units} partners={partners} />
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesTable purchases={purchases} units={units} partners={partners} />
          </TabsContent>

          <TabsContent value="units">
            <UnitsTable units={units} partners={partners} />
          </TabsContent>

          <TabsContent value="analytics">
            <BudgetChart budgetData={budgetCategories} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      <PurchaseForm
        open={showPurchaseForm}
        onOpenChange={setShowPurchaseForm}
        onSubmit={handleAddPurchase}
        units={units}
        partners={partners}
      />

      <UnitForm
        open={showUnitForm}
        onOpenChange={setShowUnitForm}
        onSubmit={handleAddUnit}
        partners={partners}
      />
    </div>
  );
}