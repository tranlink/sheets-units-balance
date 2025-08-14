import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Calculator, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Plus,
  BarChart3,
  FileText,
  UserPlus,
  Settings,
  LogIn,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Project as DBProject, 
  Partner as DBPartner, 
  Unit as DBUnit, 
  Purchase as DBPurchase,
  createProject, updateProject, getProjects,
  createPartner, updatePartner, getPartners,
  createUnit, updateUnit, getUnits,
  createPurchase, getPurchases
} from '@/lib/database';
import { BudgetCategory, Alert } from '@/types/construction';
import { ProjectSettings, ProjectSettingsForm } from '@/components/forms/ProjectSettingsForm';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { UnitForm } from '@/components/forms/UnitForm';
import { PartnerForm } from '@/components/forms/PartnerForm';
import { PurchasesTable } from '@/components/tables/PurchasesTable';
import { UnitsTable } from '@/components/tables/UnitsTable';
import { PartnersTable } from '@/components/tables/PartnersTable';
import { ReportsTab } from '@/components/reports/ReportsTab';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { BudgetChart } from '@/components/charts/BudgetChart';
import { exportProjectToExcel } from '@/utils/excelExport';

// Login Component
function LoginComponent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a login link!',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Construction Cost Tracker</CardTitle>
          <CardDescription>Sign in to track your construction costs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface ConstructionTrackerProps {
  projectId?: string;
}

export default function ConstructionTracker({ projectId }: ConstructionTrackerProps) {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State management
  const [currentProject, setCurrentProject] = useState<DBProject | null>(null);
  const [purchases, setPurchases] = useState<DBPurchase[]>([]);
  const [units, setUnits] = useState<DBUnit[]>([]);
  const [partners, setPartners] = useState<DBPartner[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DBPartner | undefined>();

  // Check for authentication session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load project data when user is authenticated
  useEffect(() => {
    if (session) {
      loadProjectData();
    }
  }, [session]);

  const loadProjectData = async () => {
    try {
      let project;
      
      if (projectId) {
        // Load specific project
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (error) throw error;
        project = data;
      } else {
        // Get or create default project (for backward compatibility)
        const projects = await getProjects();
        project = projects[0];
        
        if (!project) {
          // Create default project
          project = await createProject({
            name: 'Construction Cost Tracker',
            description: 'Track your Airbnb construction costs',
            total_budget: 300000,
            location: '',
            categories: [
              'Plumbing', 'Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Flooring',
              'Electrical', 'HVAC', 'Roofing', 'Painting', 'Doors & Windows', 
              'Insulation', 'Foundation', 'Exterior', 'Other'
            ],
          });
        }
      }
      
      setCurrentProject(project);
      
      // Load related data
      const [partnersData, unitsData, purchasesData] = await Promise.all([
        getPartners(project.id),
        getUnits(project.id),
        getPurchases(project.id)
      ]);
      
      setPartners(partnersData as DBPartner[]);
      setUnits(unitsData as DBUnit[]);
      setPurchases(purchasesData);
      
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load project data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!session) {
    return <LoginComponent />;
  }

  // Show loading if no project loaded yet
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalBudget = currentProject.total_budget;
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const activeUnits = units.filter(unit => unit.status === 'In Progress').length;
  const completedUnits = units.filter(unit => unit.status === 'Completed').length;

  // Budget categories calculation
  const budgetCategories: BudgetCategory[] = currentProject.categories.map(category => {
    const spentAmount = purchases
      .filter(p => p.category === category)
      .reduce((sum, p) => sum + p.total_cost, 0);
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

  
  const handleAddPurchase = async (purchaseData: {
    date: string;
    category: string;
    description: string;
    quantity: number;
    unit_price: number;
    units: string[];
    partner_id?: string;
    distributeEvenly: boolean;
  }) => {
    try {
      const totalCost = purchaseData.quantity * purchaseData.unit_price;
      
      if (purchaseData.distributeEvenly && purchaseData.units.length > 1) {
        // Split into multiple purchases, one per unit
        const quantityPerUnit = purchaseData.quantity / purchaseData.units.length;
        const costPerUnit = totalCost / purchaseData.units.length;
        
        const newPurchases = await Promise.all(
          purchaseData.units.map(unitId => 
            createPurchase({
              project_id: currentProject.id,
              unit_id: unitId,
              partner_id: purchaseData.partner_id,
              date: purchaseData.date,
              category: purchaseData.category,
              description: `${purchaseData.description} (${quantityPerUnit} units)`,
              quantity: quantityPerUnit,
              unit_price: purchaseData.unit_price,
              total_cost: costPerUnit,
            })
          )
        );
        
        setPurchases(prev => [...newPurchases, ...prev]);
        
        toast({
          title: 'Purchase Added',
          description: `Added ${purchaseData.description} to ${purchaseData.units.length} units for EGP ${totalCost.toLocaleString()} total`,
        });
      } else {
        // Create single purchase
        const newPurchase = await createPurchase({
          project_id: currentProject.id,
          unit_id: purchaseData.units[0],
          partner_id: purchaseData.partner_id,
          date: purchaseData.date,
          category: purchaseData.category,
          description: purchaseData.description,
          quantity: purchaseData.quantity,
          unit_price: purchaseData.unit_price,
          total_cost: totalCost,
        });
        
        setPurchases(prev => [newPurchase, ...prev]);
        
        toast({
          title: 'Purchase Added',
          description: `Added ${purchaseData.description} for EGP ${totalCost.toLocaleString()}`,
        });
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast({
        title: 'Error',
        description: 'Failed to add purchase. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddPartner = async (partnerData: {
    name: string;
    email?: string;
    phone?: string;
    total_contribution: number;
  }) => {
    try {
      if (editingPartner) {
        // Update existing partner
        const updatedPartner = await updatePartner(editingPartner.id, partnerData);
        setPartners(prev => prev.map(p => 
          p.id === editingPartner.id ? updatedPartner as DBPartner : p
        ));
        toast({
          title: 'Partner Updated',
          description: `Updated partner: ${partnerData.name}`,
        });
        setEditingPartner(undefined);
      } else {
        // Add new partner
        const newPartner = await createPartner({
          project_id: currentProject.id,
          ...partnerData,
          status: 'Active'
        });
        
        setPartners(prev => [...prev, newPartner as DBPartner]);
        toast({
          title: 'Partner Added',
          description: `Added new partner: ${partnerData.name}`,
        });
      }
    } catch (error) {
      console.error('Error managing partner:', error);
      toast({
        title: 'Error',
        description: 'Failed to manage partner. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddUnit = async (unitData: {
    name: string;
    type: string;
    budget: number;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    partner_id?: string;
  }) => {
    try {
      const newUnit = await createUnit({
        project_id: currentProject.id,
        ...unitData
      });
      
      setUnits(prev => [...prev, newUnit as DBUnit]);
      toast({
        title: 'Unit Created',
        description: `Created new unit: ${unitData.name}`,
      });
    } catch (error) {
      console.error('Error adding unit:', error);
      toast({
        title: 'Error',
        description: 'Failed to add unit. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditPartner = (partner: any) => {
    // Find the original partner from the database
    const dbPartner = partners.find(p => p.id === partner.id);
    if (dbPartner) {
      setEditingPartner(dbPartner);
      setShowPartnerForm(true);
    }
  };

  const handleUpdateProjectSettings = async (settings: ProjectSettings) => {
    try {
      const updatedProject = await updateProject(currentProject.id, {
        name: settings.name,
        description: settings.description,
        total_budget: settings.totalBudget,
        location: settings.location,
        categories: settings.categories,
      });
      
      setCurrentProject(updatedProject);
      toast({
        title: 'Project Settings Updated',
        description: `Project "${settings.name}" has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleExportToExcel = () => {
    try {
      const filename = exportProjectToExcel(
        currentProject,
        partners,
        units,
        purchases
      );
      toast({
        title: 'Export Successful',
        description: `Data exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data to Excel. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSyncToGoogleSheets = async () => {
    if (!currentProject) return;
    
    const spreadsheetId = prompt('Enter your Google Sheet ID (from the URL):');
    if (!spreadsheetId) return;
    
    console.log('Starting sync to Google Sheets...', { projectId: currentProject.id, spreadsheetId });
    
    try {
      console.log('Calling sync-google-sheets function...');
      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: {
          projectId: currentProject.id,
          spreadsheetId: spreadsheetId
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Sync Failed",
          description: `Error: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        toast({
          title: "Sync Failed",
          description: `Error: ${data.error}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Sync successful:', data);
      toast({
        title: "Sync Successful",
        description: "Project data has been synced to Google Sheets with separate tabs for Project, Partners, Units, and Purchases.",
      });
    } catch (error) {
      console.error('Unexpected error syncing to Google Sheets:', error);
      toast({
        title: "Sync Failed",
        description: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-card-foreground">{currentProject.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectSettings(true)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentProject.description}
                {currentProject.location && ` • ${currentProject.location}`}
              </p>
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
            <Button onClick={() => setShowPartnerForm(true)} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handleSyncToGoogleSheets} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Sync Google Sheets
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              Logout
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PurchasesTable 
                purchases={purchases.slice(0, 5).map(p => ({
                  id: p.id,
                  date: p.date,
                  category: p.category,
                  description: p.description,
                  quantity: p.quantity,
                  unitPrice: p.unit_price,
                  totalCost: p.total_cost,
                  unit: p.unit_id,
                  partner: p.partner_id,
                  receipt: p.receipt_url
                }))} 
                units={units.map(u => ({ id: u.id, name: u.name }))} 
                partners={partners.map(p => ({ id: p.id, name: p.name }))}
                categories={currentProject.categories}
              />
              <UnitsTable 
                units={units.map(u => ({
                  id: u.id,
                  name: u.name,
                  type: u.type,
                  budget: u.budget,
                  actualCost: purchases.filter(p => p.unit_id === u.id).reduce((sum, p) => sum + p.total_cost, 0),
                  status: u.status,
                  partner: u.partner_id
                }))} 
                partners={partners.map(p => ({ id: p.id, name: p.name }))} 
              />
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesTable 
              purchases={purchases.map(p => ({
                id: p.id,
                date: p.date,
                category: p.category,
                description: p.description,
                quantity: p.quantity,
                unitPrice: p.unit_price,
                totalCost: p.total_cost,
                unit: p.unit_id,
                partner: p.partner_id,
                receipt: p.receipt_url
              }))} 
              units={units.map(u => ({ id: u.id, name: u.name }))} 
              partners={partners.map(p => ({ id: p.id, name: p.name }))}
              categories={currentProject.categories} 
            />
          </TabsContent>

          <TabsContent value="units">
            <UnitsTable 
              units={units.map(u => ({
                id: u.id,
                name: u.name,
                type: u.type,
                budget: u.budget,
                actualCost: purchases.filter(p => p.unit_id === u.id).reduce((sum, p) => sum + p.total_cost, 0),
                status: u.status,
                partner: u.partner_id
              }))} 
              partners={partners.map(p => ({ id: p.id, name: p.name }))} 
            />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersTable 
              partners={partners.map(p => ({
                id: p.id,
                name: p.name,
                email: p.email || '',
                phone: p.phone || '',
                totalContribution: p.total_contribution,
                totalSpent: 0, // Will be calculated in the component
                balance: 0, // Will be calculated in the component
                status: p.status as 'Active' | 'Inactive'
              }))} 
              purchases={purchases.map(p => ({
                id: p.id,
                date: p.date,
                category: p.category,
                description: p.description,
                quantity: p.quantity,
                unitPrice: p.unit_price,
                totalCost: p.total_cost,
                unit: p.unit_id,
                partner: p.partner_id,
                receipt: p.receipt_url
              }))}
              onEditPartner={handleEditPartner}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab projectId={currentProject.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab 
              projectId={currentProject.id}
              purchases={purchases.map(p => ({
                id: p.id,
                date: p.date,
                category: p.category,
                description: p.description,
                quantity: p.quantity,
                unitPrice: p.unit_price,
                totalCost: p.total_cost,
                unit: p.unit_id,
                partner: p.partner_id,
                receipt: p.receipt_url
              }))}
              partners={partners.map(p => ({
                id: p.id,
                name: p.name,
                email: p.email || '',
                phone: p.phone || '',
                totalContribution: p.total_contribution,
                totalSpent: 0, // Calculate this
                balance: p.total_contribution,
                status: p.status as 'Active' | 'Inactive'
              }))}
              units={units.map(u => ({
                id: u.id,
                name: u.name,
                type: u.type,
                budget: u.budget,
                actualCost: purchases.filter(p => p.unit_id === u.id).reduce((sum, p) => sum + p.total_cost, 0),
                status: u.status as 'Planning' | 'In Progress' | 'Completed' | 'On Hold',
                completionDate: u.completion_date,
                partner: u.partner_id
              }))}
              totalBudget={currentProject.total_budget}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Forms */}
      <PurchaseForm
        open={showPurchaseForm}
        onOpenChange={setShowPurchaseForm}
        onSubmit={handleAddPurchase}
        units={units.map(u => ({ id: u.id, name: u.name }))}
        partners={partners.map(p => ({ id: p.id, name: p.name }))}
        categories={currentProject.categories}
      />

      <UnitForm
        open={showUnitForm}
        onOpenChange={setShowUnitForm}
        onSubmit={handleAddUnit}
        partners={partners.map(p => ({ id: p.id, name: p.name }))}
      />

      <PartnerForm
        open={showPartnerForm}
        onOpenChange={(open) => {
          setShowPartnerForm(open);
          if (!open) setEditingPartner(undefined);
        }}
        onSubmit={handleAddPartner}
        partner={editingPartner ? {
          id: editingPartner.id,
          name: editingPartner.name,
          email: editingPartner.email || '',
          phone: editingPartner.phone || '',
          totalContribution: editingPartner.total_contribution,
          totalSpent: 0,
          balance: 0,
          status: editingPartner.status as 'Active' | 'Inactive'
        } : undefined}
      />

      <ProjectSettingsForm
        open={showProjectSettings}
        onOpenChange={setShowProjectSettings}
        onSubmit={handleUpdateProjectSettings}
        currentSettings={{
          name: currentProject.name,
          description: currentProject.description || '',
          totalBudget: currentProject.total_budget,
          location: currentProject.location || '',
          categories: currentProject.categories,
        }}
      />
    </div>
  );
}
