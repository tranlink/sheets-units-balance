import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Purchase } from '@/types/construction';

const purchaseSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  units: z.array(z.string()).min(1, 'At least one unit must be selected'),
  partner: z.string().optional(),
  distributeEvenly: z.boolean().default(false),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (purchase: {
    date: string;
    category: string;
    description: string;
    quantity: number;
    unit_price: number;
    units: string[];
    partner_id?: string;
    distributeEvenly: boolean;
  }) => void;
  units: Array<{ id: string; name: string }>;
  partners: Array<{ id: string; name: string }>;
  categories: string[];
}

const categories = [
  'Plumbing',
  'Bathroom',
  'Bedroom',
  'Kitchen',
  'Living Room',
  'Flooring',
  'Electrical',
  'HVAC',
  'Roofing',
  'Painting',
  'Doors & Windows',
  'Insulation',
  'Foundation',
  'Exterior',
  'Other',
];

export function PurchaseForm({ open, onOpenChange, onSubmit, units, partners, categories: projectCategories }: PurchaseFormProps) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectAllUnits, setSelectAllUnits] = useState(false);
  
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: 1,
      unitPrice: 0,
      units: [],
      distributeEvenly: false,
    },
  });

  const handleSubmit = (data: PurchaseFormData) => {
    onSubmit({
      date: format(data.date, 'yyyy-MM-dd'),
      category: data.category,
      description: data.description,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      units: data.units,
      partner_id: data.partner,
      distributeEvenly: data.distributeEvenly,
    });
    form.reset();
    setSelectedUnits([]);
    setSelectAllUnits(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Purchase</DialogTitle>
          <DialogDescription>
            Record a new construction expense or purchase.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purchase..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (EGP)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unit Selection */}
            <FormItem>
              <FormLabel>Apply to Units</FormLabel>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectAllUnits}
                    onCheckedChange={(checked) => {
                      setSelectAllUnits(!!checked);
                      if (checked) {
                        const allUnitIds = units.map(u => u.id);
                        setSelectedUnits(allUnitIds);
                        form.setValue('units', allUnitIds);
                      } else {
                        setSelectedUnits([]);
                        form.setValue('units', []);
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Apply to all units
                  </label>
                </div>
                
                {!selectAllUnits && (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {units.map((unit) => (
                      <div key={unit.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={unit.id}
                          checked={selectedUnits.includes(unit.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newSelection = [...selectedUnits, unit.id];
                              setSelectedUnits(newSelection);
                              form.setValue('units', newSelection);
                            } else {
                              const newSelection = selectedUnits.filter(id => id !== unit.id);
                              setSelectedUnits(newSelection);
                              form.setValue('units', newSelection);
                            }
                          }}
                        />
                        <label htmlFor={unit.id} className="text-sm">
                          {unit.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {form.formState.errors.units && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.units.message}
                  </p>
                )}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="distributeEvenly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Distribute evenly across selected units
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Split quantity and cost equally among selected units
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Purchase</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}