
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Define form schema with zod
const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username cannot exceed 20 characters" })
    .regex(/^[a-z0-9_]+$/, { message: "Username can only contain lowercase letters, numbers, and underscores" }),
  bio: z.string().max(160).optional(),
  class: z.string().min(2, { message: "Klas naam is verplicht" }),
  interests: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileUpdateForm: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      username: user?.username || "",
      bio: user?.bio || "",
      class: user?.class || "",
      interests: user?.interests || [],
    },
    mode: "onChange"
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
        class: user.class || "",
        interests: user.interests || [],
      });
      
      // Initialize interests array
      setInterests(user.interests || []);
    }
  }, [user, form]);
  
  // Add a new interest
  const handleAddInterest = () => {
    const trimmedInterest = interestInput.trim();
    
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
      const updatedInterests = [...interests, trimmedInterest];
      setInterests(updatedInterests);
      form.setValue("interests", updatedInterests);
      setInterestInput("");
    }
  };
  
  // Remove an interest
  const handleRemoveInterest = (interest: string) => {
    const updatedInterests = interests.filter(i => i !== interest);
    setInterests(updatedInterests);
    form.setValue("interests", updatedInterests);
  };
  
  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Add interests to data
      data.interests = interests;
      
      // Update user profile
      const success = await updateUserProfile({
        displayName: data.displayName,
        username: data.username,
        bio: data.bio || "",
        class: data.class,
        interests: data.interests,
      });
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        toast({
          title: "Update failed",
          description: "There was a problem updating your profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle keypress for interest input
  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Choose a username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Tell us about yourself" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Klas</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Jouw klas" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Interests</FormLabel>
          <div className="flex gap-2">
            <Input 
              value={interestInput} 
              onChange={e => setInterestInput(e.target.value)}
              onKeyPress={handleInterestKeyPress}
              placeholder="Add interests (press Enter)" 
            />
            <Button 
              type="button" 
              onClick={handleAddInterest} 
              disabled={!interestInput.trim()}
            >
              Add
            </Button>
          </div>
          
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="px-2 py-1">
                  {interest}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileUpdateForm;
