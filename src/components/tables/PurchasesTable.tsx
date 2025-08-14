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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Purchase } from '@/types/construction';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';

interface PurchasesTableProps {
  purchases: Purchase[];
  units: Array<{ id: string; name: string }>;
  partners: Array<{ id: string; name: string }>;
  categories?: string[];
}

export function PurchasesTable({ purchases, units, partners, categories = [] }: PurchasesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  const getUnitName = (unitId?: string) => {
    if (!unitId) return 'General';
    return units.find(u => u.id === unitId)?.name || 'Unknown Unit';
  };

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return '-';
    return partners.find(p => p.id === partnerId)?.name || 'Unknown Partner';
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch = purchase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          purchase.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || purchase.category === selectedCategory;
      const matchesUnit = selectedUnit === 'all' || purchase.unit === selectedUnit || 
                         (selectedUnit === 'general' && !purchase.unit);
      const matchesPartner = selectedPartner === 'all' || purchase.partner_id === selectedPartner ||
                           (selectedPartner === 'none' && !purchase.partner_id);

      return matchesSearch && matchesCategory && matchesUnit && matchesPartner;
    });
  }, [purchases, searchTerm, selectedCategory, selectedUnit, selectedPartner]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const baseColors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-orange-100 text-orange-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-cyan-100 text-cyan-800',
      'bg-pink-100 text-pink-800',
      'bg-teal-100 text-teal-800',
      'bg-lime-100 text-lime-800',
      'bg-amber-100 text-amber-800',
      'bg-stone-100 text-stone-800',
      'bg-sky-100 text-sky-800',
      'bg-gray-100 text-gray-800',
    ];
    
    // Get consistent color for each category
    const index = categories.indexOf(category);
    if (index !== -1) {
      return baseColors[index % baseColors.length];
    }
    
    // Fallback for unknown categories
    return 'bg-gray-100 text-gray-800';
  };

  const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalFilteredAmount = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Purchases</CardTitle>
        <CardDescription>
          {filteredPurchases.length < purchases.length 
            ? `Showing ${filteredPurchases.length} of ${purchases.length} purchases. Filtered total: ${formatCurrency(totalFilteredAmount)}`
            : `All construction expenses and purchases. Total: ${formatCurrency(totalAmount)}`
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Unit Filter */}
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="general">General</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Partner Filter */}
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger>
                <SelectValue placeholder="All Partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                <SelectItem value="none">No Partner</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Partner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {purchases.length === 0 
                      ? "No purchases recorded yet. Click \"Add New Purchase\" to get started."
                      : "No purchases match your current filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {format(new Date(purchase.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getCategoryColor(purchase.category)}
                      >
                        {purchase.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {purchase.description}
                    </TableCell>
                    <TableCell>{getUnitName(purchase.unit)}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>{formatCurrency(purchase.unitPrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(purchase.totalCost)}
                    </TableCell>
                    <TableCell>{getPartnerName(purchase.partner_id)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}