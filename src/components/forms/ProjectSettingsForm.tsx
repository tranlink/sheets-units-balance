import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Edit2 } from 'lucide-react';

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
  categories: string[];
}

interface ProjectSettingsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (settings: ProjectSettings) => void;
  currentSettings: ProjectSettings;
}

export function ProjectSettingsForm({ open, onOpenChange, onSubmit, currentSettings }: ProjectSettingsFormProps) {
  const [categories, setCategories] = useState<string[]>(currentSettings.categories);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
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
      categories: categories,
    });
    onOpenChange(false);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleEditCategory = (index: number, newValue: string) => {
    if (newValue.trim() && !categories.includes(newValue.trim())) {
      const updatedCategories = [...categories];
      updatedCategories[index] = newValue.trim();
      setCategories(updatedCategories);
    }
    setEditingCategory(null);
  };

  // Reset form when dialog opens with current settings
  React.useEffect(() => {
    if (open) {
      setCategories(currentSettings.categories);
      setNewCategory('');
      setEditingCategory(null);
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project information, budget, and manage purchase categories.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
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
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Manage Categories</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, or remove purchase categories for your project.
              </p>
              
              {/* Add New Category */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter new category name..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button 
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Categories List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                    {editingCategory?.index === index ? (
                      <Input
                        value={editingCategory.value}
                        onChange={(e) => setEditingCategory({ index, value: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditCategory(index, editingCategory.value);
                          }
                          if (e.key === 'Escape') {
                            setEditingCategory(null);
                          }
                        }}
                        onBlur={() => handleEditCategory(index, editingCategory.value)}
                        autoFocus
                        className="flex-1"
                      />
                    ) : (
                      <>
                        <Badge variant="secondary" className="flex-1 justify-start">
                          {category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory({ index, value: category })}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No categories yet. Add your first category above.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => form.handleSubmit(handleSubmit)()}>
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}