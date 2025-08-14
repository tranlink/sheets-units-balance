-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  location TEXT,
  categories TEXT[] NOT NULL DEFAULT ARRAY['Plumbing', 'Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Flooring', 'Electrical', 'HVAC', 'Roofing', 'Painting', 'Doors & Windows', 'Insulation', 'Foundation', 'Exterior', 'Other'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  total_contribution DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create units table
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'Completed', 'On Hold')),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for partners
CREATE POLICY "Users can view partners in their projects" 
ON public.partners 
FOR SELECT 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create partners in their projects" 
ON public.partners 
FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update partners in their projects" 
ON public.partners 
FOR UPDATE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete partners in their projects" 
ON public.partners 
FOR DELETE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Create RLS policies for units
CREATE POLICY "Users can view units in their projects" 
ON public.units 
FOR SELECT 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create units in their projects" 
ON public.units 
FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update units in their projects" 
ON public.units 
FOR UPDATE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete units in their projects" 
ON public.units 
FOR DELETE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Create RLS policies for purchases
CREATE POLICY "Users can view purchases in their projects" 
ON public.purchases 
FOR SELECT 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create purchases in their projects" 
ON public.purchases 
FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update purchases in their projects" 
ON public.purchases 
FOR UPDATE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete purchases in their projects" 
ON public.purchases 
FOR DELETE 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate unit costs
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get category spending
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
$$ LANGUAGE plpgsql SECURITY DEFINER;