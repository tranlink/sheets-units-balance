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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Unit } from '@/types/construction';
import { Search, Filter, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnitsTableProps {
  units: Unit[];
  partners: Array<{ id: string; name: string }>;
  onEditUnit?: (unit: Unit) => void;
}

export function UnitsTable({ units, partners, onEditUnit }: UnitsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return '-';
    return partners.find(p => p.id === partnerId)?.name || 'Unknown Partner';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: Unit['status']) => {
    const colors = {
      'Planning': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getBudgetUsagePercentage = (actual: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  };

  const getBudgetUsageColor = (percentage: number) => {
    if (percentage <= 70) return 'text-green-600';
    if (percentage <= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          unit.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || unit.status === selectedStatus;
      const matchesType = selectedType === 'all' || unit.type === selectedType;
      const matchesPartner = selectedPartner === 'all' || unit.partner === selectedPartner ||
                           (selectedPartner === 'none' && !unit.partner);

      return matchesSearch && matchesStatus && matchesType && matchesPartner;
    });
  }, [units, searchTerm, selectedStatus, selectedType, selectedPartner]);

  const uniqueTypes = [...new Set(units.map(unit => unit.type))];

  const totalBudget = filteredUnits.reduce((sum, unit) => sum + unit.budget, 0);
  const totalActual = filteredUnits.reduce((sum, unit) => sum + unit.actualCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Construction Units</CardTitle>
        <CardDescription>
          {filteredUnits.length < units.length 
            ? `Showing ${filteredUnits.length} of ${units.length} units. Filtered Budget: ${formatCurrency(totalBudget)} | Spent: ${formatCurrency(totalActual)}`
            : `Project units and their budget status. Total Budget: ${formatCurrency(totalBudget)} | Spent: ${formatCurrency(totalActual)}`
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
                placeholder="Search units..."
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
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
                <TableHead>Unit Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actual Cost</TableHead>
                <TableHead>Budget Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Partner</TableHead>
                {onEditUnit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onEditUnit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    {units.length === 0 
                      ? "No units created yet. Click \"Create New Unit\" to get started."
                      : "No units match your current filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => {
                  const usagePercentage = getBudgetUsagePercentage(unit.actualCost, unit.budget);
                  return (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.type}</TableCell>
                      <TableCell>{formatCurrency(unit.budget)}</TableCell>
                      <TableCell>{formatCurrency(unit.actualCost)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={usagePercentage} className="w-20 h-2" />
                          <span className={`text-sm font-medium ${getBudgetUsageColor(usagePercentage)}`}>
                            {usagePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(unit.status)}
                        >
                          {unit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPartnerName(unit.partner)}</TableCell>
                      {onEditUnit && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Unit edit button clicked for:', unit);
                              onEditUnit(unit);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}