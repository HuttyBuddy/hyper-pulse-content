import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancedImage {
  id: string;
  original_filename: string;
  original_url: string;
  enhanced_url: string | null;
  enhancement_preset: string | null;
  tags: string[] | null;
  category: string;
  file_size: number | null;
  dimensions: any;
  created_at: string;
}

export const useImageEnhancement = () => {
  const [loading, setLoading] = useState(false);

  const uploadImage = useCallback(async (file: File): Promise<EnhancedImage | null> => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload images");
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('enhanced-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('enhanced-images')
        .getPublicUrl(fileName);

      // Get image dimensions
      const img = new Image();
      const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = URL.createObjectURL(file);
      });

      // Save metadata to database
      const { data, error } = await supabase
        .from('enhanced_images')
        .insert({
          user_id: user.id,
          original_filename: file.name,
          original_url: publicUrl,
          file_size: file.size,
          dimensions: dimensions as any,
          category: 'lifestyle' // Default category
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || "Failed to upload image");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const enhanceImage = useCallback(async (imageId: string, preset: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Update the image record with enhancement preset
      const { error } = await supabase
        .from('enhanced_images')
        .update({
          enhancement_preset: preset,
          enhancement_settings: { preset }
        })
        .eq('id', imageId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error enhancing image:', error);
      toast.error(error.message || "Failed to enhance image");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserImages = useCallback(async (): Promise<EnhancedImage[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('enhanced_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast.error("Failed to load images");
      return [];
    }
  }, []);

  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // First get the image record to get the file path
      const { data: image, error: fetchError } = await supabase
        .from('enhanced_images')
        .select('original_url')
        .eq('id', imageId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const urlParts = image.original_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userFolder = urlParts[urlParts.length - 2];
      const filePath = `${userFolder}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('enhanced-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('enhanced_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      return true;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || "Failed to delete image");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    uploadImage,
    enhanceImage,
    getUserImages,
    deleteImage
  };
};