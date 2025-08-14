import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface UnitCostData {
  unit_id: string;
  unit_name: string;
  unit_type: string;
  budget: number;
  actual_cost: number;
  cost_percentage: number;
}

interface UnitCostReportProps {
  unitCosts: UnitCostData[];
  loading?: boolean;
}

export function UnitCostReport({ unitCosts, loading = false }: UnitCostReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage <= 70) return 'text-green-600';
    if (percentage <= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBudgetStatusBadge = (percentage: number) => {
    if (percentage <= 70) return { variant: 'default' as const, label: 'On Track' };
    if (percentage <= 90) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'destructive' as const, label: 'Over Budget' };
  };

  const totalBudget = unitCosts.reduce((sum, unit) => sum + unit.budget, 0);
  const totalActual = unitCosts.reduce((sum, unit) => sum + unit.actual_cost, 0);
  const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unit Cost Analysis</CardTitle>
          <CardDescription>Detailed cost breakdown for each construction unit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Cost Analysis</CardTitle>
        <CardDescription>
          Detailed cost breakdown for each construction unit
        </CardDescription>
        
        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</p>
            <p className="text-sm text-muted-foreground">Total Budget</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalActual)}</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className={`text-2xl font-bold ${getBudgetStatusColor(totalPercentage)}`}>
              {totalPercentage.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Budget Used</p>
          </div>
        </div>
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
                <TableHead>Variance</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No unit cost data available
                  </TableCell>
                </TableRow>
              ) : (
                unitCosts.map((unit) => {
                  const variance = unit.actual_cost - unit.budget;
                  const badge = getBudgetStatusBadge(unit.cost_percentage);
                  
                  return (
                    <TableRow key={unit.unit_id}>
                      <TableCell className="font-medium">{unit.unit_name}</TableCell>
                      <TableCell>{unit.unit_type}</TableCell>
                      <TableCell>{formatCurrency(unit.budget)}</TableCell>
                      <TableCell>{formatCurrency(unit.actual_cost)}</TableCell>
                      <TableCell>
                        <span className={variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(unit.cost_percentage, 100)} className="w-20 h-2" />
                          <span className={`text-sm font-medium ${getBudgetStatusColor(unit.cost_percentage)}`}>
                            {unit.cost_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>
                          {badge.label}
                        </Badge>
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
  );
}