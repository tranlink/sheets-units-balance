import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Unit } from '@/types/construction';

const unitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  type: z.string().min(1, 'Unit type is required'),
  budget: z.number().min(0.01, 'Budget must be greater than 0'),
  status: z.enum(['Planning', 'In Progress', 'Completed', 'On Hold']),
  partner: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (unit: {
    name: string;
    type: string;
    budget: number;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    partner_id?: string;
  }) => void;
  partners: Array<{ id: string; name: string }>;
  unit?: Unit;
}

const unitTypes = [
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  'Penthouse',
  'Commercial Space',
  'Common Area',
  'Other',
];

export function UnitForm({ open, onOpenChange, onSubmit, partners, unit }: UnitFormProps) {
  console.log('UnitForm rendered with unit:', unit);
  
  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: unit?.name || '',
      type: unit?.type || '',
      budget: unit?.budget || 0,
      status: unit?.status || 'Planning',
      partner: unit?.partner || '',
    },
  });

  // Reset form when unit changes
  useEffect(() => {
    console.log('UnitForm useEffect triggered with unit:', unit);
    if (unit) {
      console.log('Resetting form with unit data:', {
        name: unit.name,
        type: unit.type,
        budget: unit.budget,
        status: unit.status,
        partner: unit.partner || '',
      });
      form.reset({
        name: unit.name,
        type: unit.type,
        budget: unit.budget,
        status: unit.status,
        partner: unit.partner || '',
      });
    } else {
      console.log('Resetting form to empty values');
      form.reset({
        name: '',
        type: '',
        budget: 0,
        status: 'Planning',
        partner: '',
      });
    }
  }, [unit, form]);

  const handleSubmit = (data: UnitFormData) => {
    onSubmit({
      name: data.name,
      type: data.type,
      budget: data.budget,
      status: data.status,
      partner_id: data.partner,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{unit ? 'Edit Unit' : 'Create New Unit'}</DialogTitle>
          <DialogDescription>
            {unit ? 'Update unit information and settings.' : 'Add a new construction unit to track costs and progress.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aswan A1, Cairo B2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (EGP)</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Partner</SelectItem>
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
              <Button type="submit">{unit ? 'Update Unit' : 'Create Unit'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}