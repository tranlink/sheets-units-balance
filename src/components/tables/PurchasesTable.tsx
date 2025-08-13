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
import { Purchase } from '@/types/construction';
import { format } from 'date-fns';

interface PurchasesTableProps {
  purchases: Purchase[];
  units: Array<{ id: string; name: string }>;
  partners: Array<{ id: string; name: string }>;
}

export function PurchasesTable({ purchases, units, partners }: PurchasesTableProps) {
  const getUnitName = (unitId?: string) => {
    if (!unitId) return 'General';
    return units.find(u => u.id === unitId)?.name || 'Unknown Unit';
  };

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

  const getCategoryColor = (category: string) => {
    const colors = {
      'Plumbing': 'bg-blue-100 text-blue-800',
      'Bathroom': 'bg-purple-100 text-purple-800',
      'Bedroom': 'bg-green-100 text-green-800',
      'Kitchen': 'bg-yellow-100 text-yellow-800',
      'Living Room': 'bg-orange-100 text-orange-800',
      'Flooring': 'bg-indigo-100 text-indigo-800',
      'Electrical': 'bg-red-100 text-red-800',
      'HVAC': 'bg-cyan-100 text-cyan-800',
      'Roofing': 'bg-pink-100 text-pink-800',
      'Painting': 'bg-teal-100 text-teal-800',
      'Doors & Windows': 'bg-lime-100 text-lime-800',
      'Insulation': 'bg-amber-100 text-amber-800',
      'Foundation': 'bg-stone-100 text-stone-800',
      'Exterior': 'bg-sky-100 text-sky-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Purchases</CardTitle>
        <CardDescription>
          All construction expenses and purchases. Total: {formatCurrency(totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No purchases recorded yet. Click "Add New Purchase" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
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
                    <TableCell>{getPartnerName(purchase.partner)}</TableCell>
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