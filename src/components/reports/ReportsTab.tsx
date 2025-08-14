import React, { useEffect, useState } from 'react';
import { UnitCostReport } from '@/components/reports/UnitCostReport';
import { CategorySpendingReport } from '@/components/reports/CategorySpendingReport';
import { getUnitCosts, getCategorySpending, type UnitCostData, type CategorySpendingData } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface ReportsTabProps {
  projectId: string;
}

export function ReportsTab({ projectId }: ReportsTabProps) {
  const [unitCosts, setUnitCosts] = useState<UnitCostData[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpendingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        
        // Fetch both reports in parallel
        const [unitCostData, categorySpendingData] = await Promise.all([
          getUnitCosts(projectId),
          getCategorySpending(projectId)
        ]);
        
        setUnitCosts(unitCostData);
        setCategorySpending(categorySpendingData);
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast({
          title: 'Error Loading Reports',
          description: 'Failed to load reporting data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [projectId, toast]);

  return (
    <div className="space-y-8">
      <UnitCostReport unitCosts={unitCosts} loading={loading} />
      <CategorySpendingReport categorySpending={categorySpending} loading={loading} />
    </div>
  );
}