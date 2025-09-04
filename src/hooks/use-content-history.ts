import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SaveContentParams {
  contentType: 'blog' | 'social' | 'lifestyle' | 'newsletter';
  title: string;
  content: string;
  neighborhood?: string;
  county?: string;
  state?: string;
  reportDate?: string;
  templateUsed?: string;
}

export const useContentHistory = () => {
  const saveToHistory = useCallback(async (params: SaveContentParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('content_history')
        .insert({
          user_id: user.id,
          content_type: params.contentType,
          title: params.title,
          content: params.content,
          neighborhood: params.neighborhood,
          county: params.county,
          state: params.state,
          report_date: params.reportDate,
          template_used: params.templateUsed
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving content to history:', error);
      return false;
    }
  }, []);

  return { saveToHistory };
};