import React from 'react';
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
import { Textarea } from '@/components/ui/textarea';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  totalBudget: z.number().min(0.01, 'Budget must be greater than 0'),
  location: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export interface ProjectSettings {
  name: string;
  description?: string;
  totalBudget: number;
  location?: string;
}

interface ProjectSettingsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (settings: ProjectSettings) => void;
  currentSettings: ProjectSettings;
}

export function ProjectSettingsForm({ open, onOpenChange, onSubmit, currentSettings }: ProjectSettingsFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: currentSettings.name,
      description: currentSettings.description || '',
      totalBudget: currentSettings.totalBudget,
      location: currentSettings.location || '',
    },
  });

  const handleSubmit = (data: ProjectFormData) => {
    onSubmit({
      name: data.name,
      description: data.description,
      totalBudget: data.totalBudget,
      location: data.location,
    });
    onOpenChange(false);
  };

  // Reset form when dialog opens with current settings
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: currentSettings.name,
        description: currentSettings.description || '',
        totalBudget: currentSettings.totalBudget,
        location: currentSettings.location || '',
      });
    }
  }, [open, currentSettings, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project information, budget, and other details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aswan Airbnb Construction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your construction project..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Project Budget (EGP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="300000"
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aswan, Egypt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}