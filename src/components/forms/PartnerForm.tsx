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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Partner } from '@/types/construction';

const partnerSchema = z.object({
  name: z.string().min(1, 'Partner name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  totalContribution: z.number().min(0, 'Contribution must be 0 or greater'),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (partner: {
    name: string;
    email?: string;
    phone?: string;
    total_contribution: number;
  }) => void;
  partner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalContribution: number;
    totalSpent: number;
    balance: number;
    status: 'Active' | 'Inactive';
  };
}

export function PartnerForm({ open, onOpenChange, onSubmit, partner }: PartnerFormProps) {
  console.log('PartnerForm rendered with partner:', partner);
  
  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: partner?.name || '',
      email: partner?.email || '',
      phone: partner?.phone || '',
      totalContribution: partner?.totalContribution || 0,
    },
  });

  // Reset form when partner changes
  useEffect(() => {
    console.log('PartnerForm useEffect triggered with partner:', partner);
    if (partner) {
      console.log('Resetting form with partner data:', {
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        totalContribution: partner.totalContribution,
      });
      form.reset({
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        totalContribution: partner.totalContribution,
      });
    } else {
      console.log('Resetting form to empty values');
      form.reset({
        name: '',
        email: '',
        phone: '',
        totalContribution: 0,
      });
    }
  }, [partner, form]);

  const handleSubmit = (data: PartnerFormData) => {
    onSubmit({
      name: data.name,
      email: data.email,
      phone: data.phone,
      total_contribution: data.totalContribution,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
          <DialogDescription>
            {partner ? 'Update partner information and contribution.' : 'Add a new construction partner and their contribution.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ahmed Hassan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="partner@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+20123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalContribution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Contribution (EGP)</FormLabel>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{partner ? 'Update Partner' : 'Add Partner'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}