import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Partner, Purchase } from '@/types/construction';
import { Edit, Mail, Phone, Search, Filter } from 'lucide-react';

interface PartnersTableProps {
  partners: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    totalContribution: number;
    totalSpent: number;
    balance: number;
    status: 'Active' | 'Inactive';
  }>;
  purchases: Array<{
    id: string;
    date: string;
    category: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    unit?: string;
    partner?: string;
    receipt?: string;
  }>;
  onEditPartner: (partner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalContribution: number;
    totalSpent: number;
    balance: number;
    status: 'Active' | 'Inactive';
  }) => void;
}

export function PartnersTable({ partners, purchases, onEditPartner }: PartnersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPartnerSpending = (partnerId: string) => {
    return purchases
      .filter(p => p.partner === partnerId)
      .reduce((sum, p) => sum + p.totalCost, 0);
  };

  const getPartnerPurchasesByCategory = (partnerId: string) => {
    const partnerPurchases = purchases.filter(p => p.partner === partnerId);
    const categories: { [key: string]: number } = {};
    
    partnerPurchases.forEach(purchase => {
      categories[purchase.category] = (categories[purchase.category] || 0) + purchase.totalCost;
    });
    
    return categories;
  };

  const getStatusColor = (status: Partner['status']) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSpendingPercentage = (spent: number, contribution: number) => {
    if (contribution === 0) return 0;
    return Math.min((spent / contribution) * 100, 100);
  };

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          partner.phone.includes(searchTerm);
      const matchesStatus = selectedStatus === 'all' || partner.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [partners, searchTerm, selectedStatus]);

  const totalContributions = filteredPartners.reduce((sum, partner) => sum + partner.totalContribution, 0);
  const totalSpent = filteredPartners.reduce((sum, partner) => sum + getPartnerSpending(partner.id), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalContributions)}</p>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalContributions - totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Remaining Balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partners Overview</CardTitle>
          <CardDescription>
            {filteredPartners.length < partners.length 
              ? `Showing ${filteredPartners.length} of ${partners.length} partners`
              : "Partner contributions, spending, and settlement details"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Contribution</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Spending %</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {partners.length === 0 
                        ? "No partners added yet. Click \"Add Partner\" to get started."
                        : "No partners match your current filters."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => {
                    const spent = getPartnerSpending(partner.id);
                    const balance = partner.totalContribution - spent;
                    const spendingPercentage = getSpendingPercentage(spent, partner.totalContribution);
                    
                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{partner.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {partner.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {partner.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(partner.totalContribution)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(spent)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={spendingPercentage} className="w-20 h-2" />
                            <span className="text-sm font-medium">
                              {spendingPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getBalanceColor(balance)}`}>
                            {formatCurrency(balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(partner.status)}
                          >
                            {partner.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Partner edit button clicked for:', partner);
                              onEditPartner(partner);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Spending Breakdown */}
      {partners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Partner Spending Breakdown</CardTitle>
            <CardDescription>
              Detailed spending by category for each partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {partners.map((partner) => {
                const categories = getPartnerPurchasesByCategory(partner.id);
                const totalSpent = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
                
                if (totalSpent === 0) return null;
                
                return (
                  <div key={partner.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{partner.name} - {formatCurrency(totalSpent)}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(categories).map(([category, amount]) => (
                        <div key={category} className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">{category}</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {((amount / totalSpent) * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}