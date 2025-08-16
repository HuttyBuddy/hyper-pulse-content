import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, RotateCcw, Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface NeighborhoodData {
  neighborhood: string;
  county: string;
  state: string;
  neighborhood_slug: string;
}

interface NeighborhoodSelectorProps {
  currentNeighborhood: NeighborhoodData;
  onNeighborhoodChange: (neighborhood: NeighborhoodData) => void;
  onRefreshCurrent: () => void;
  onStartNew: () => void;
  loading?: boolean;
}

const NeighborhoodSelector = ({
  currentNeighborhood,
  onNeighborhoodChange,
  onRefreshCurrent,
  onStartNew,
  loading = false
}: NeighborhoodSelectorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<NeighborhoodData>(currentNeighborhood);
  const [recentNeighborhoods, setRecentNeighborhoods] = useState<NeighborhoodData[]>([]);

  useEffect(() => {
    loadRecentNeighborhoods();
  }, []);

  const loadRecentNeighborhoods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent neighborhoods from market_reports
      const { data } = await supabase
        .from('market_reports')
        .select('neighborhood, county, state, neighborhood_slug')
        .eq('user_id', user.id)
        .not('neighborhood', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        // Remove duplicates
        const unique = data.filter((item, index, self) => 
          index === self.findIndex(t => t.neighborhood_slug === item.neighborhood_slug)
        );
        setRecentNeighborhoods(unique as NeighborhoodData[]);
      }
    } catch (error) {
      console.error('Error loading recent neighborhoods:', error);
    }
  };

  const createSlug = (neighborhood: string) => {
    return neighborhood
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSaveNeighborhood = () => {
    if (!editData.neighborhood.trim() || !editData.county.trim() || !editData.state.trim()) {
      toast("Please fill in all fields");
      return;
    }

    const newData = {
      ...editData,
      neighborhood_slug: createSlug(editData.neighborhood)
    };

    onNeighborhoodChange(newData);
    setIsEditing(false);
    toast("Neighborhood updated");
  };

  const handleSelectRecent = (neighborhood: NeighborhoodData) => {
    setEditData(neighborhood);
    onNeighborhoodChange(neighborhood);
    toast(`Switched to ${neighborhood.neighborhood}`);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Neighborhood
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={editData.neighborhood}
                onChange={(e) => setEditData({ ...editData, neighborhood: e.target.value })}
                placeholder="e.g., Carmichael"
              />
            </div>
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={editData.county}
                onChange={(e) => setEditData({ ...editData, county: e.target.value })}
                placeholder="e.g., Sacramento County"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={editData.state}
                onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                placeholder="e.g., CA"
                maxLength={2}
              />
            </div>
          </div>

          {recentNeighborhoods.length > 0 && (
            <div>
              <Label>Recent Neighborhoods</Label>
              <Select onValueChange={(value) => {
                const recent = recentNeighborhoods.find(n => n.neighborhood_slug === value);
                if (recent) {
                  setEditData(recent);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select from recent..." />
                </SelectTrigger>
                <SelectContent>
                  {recentNeighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.neighborhood_slug} value={neighborhood.neighborhood_slug}>
                      {neighborhood.neighborhood}, {neighborhood.county}, {neighborhood.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveNeighborhood}>
              Save & Switch
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Neighborhood
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshCurrent}
              className="flex items-center gap-1 hover:bg-accent/50 transition-colors"
              disabled={loading}
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Change Area
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium">
          {currentNeighborhood.neighborhood}, {currentNeighborhood.county}, {currentNeighborhood.state}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Click "Refresh Data" to get the latest market information or "Change Area" to analyze a different neighborhood.
        </p>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodSelector;