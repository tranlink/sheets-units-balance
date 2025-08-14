-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_unit_costs function
CREATE OR REPLACE FUNCTION get_unit_costs(project_uuid UUID)
RETURNS TABLE (
  unit_id UUID,
  unit_name TEXT,
  unit_type TEXT,
  budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  cost_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as unit_id,
    u.name as unit_name,
    u.type as unit_type,
    u.budget,
    COALESCE(SUM(p.total_cost), 0) as actual_cost,
    CASE 
      WHEN u.budget > 0 THEN ROUND((COALESCE(SUM(p.total_cost), 0) / u.budget * 100)::DECIMAL, 2)
      ELSE 0
    END as cost_percentage
  FROM public.units u
  LEFT JOIN public.purchases p ON u.id = p.unit_id
  WHERE u.project_id = project_uuid
  GROUP BY u.id, u.name, u.type, u.budget
  ORDER BY u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_category_spending function
CREATE OR REPLACE FUNCTION get_category_spending(project_uuid UUID)
RETURNS TABLE (
  category TEXT,
  total_spent DECIMAL(12,2),
  purchase_count INTEGER,
  average_purchase DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    SUM(p.total_cost) as total_spent,
    COUNT(*)::INTEGER as purchase_count,
    ROUND(AVG(p.total_cost)::DECIMAL, 2) as average_purchase
  FROM public.purchases p
  WHERE p.project_id = project_uuid
  GROUP BY p.category
  ORDER BY SUM(p.total_cost) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;