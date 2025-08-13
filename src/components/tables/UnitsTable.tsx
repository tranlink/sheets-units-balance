import React from 'react';
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
import { Unit } from '@/types/construction';

interface UnitsTableProps {
  units: Unit[];
  partners: Array<{ id: string; name: string }>;
}

export function UnitsTable({ units, partners }: UnitsTableProps) {
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

  const totalBudget = units.reduce((sum, unit) => sum + unit.budget, 0);
  const totalActual = units.reduce((sum, unit) => sum + unit.actualCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Construction Units</CardTitle>
        <CardDescription>
          Project units and their budget status. Total Budget: {formatCurrency(totalBudget)} | 
          Spent: {formatCurrency(totalActual)}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No units created yet. Click "Create New Unit" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit) => {
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