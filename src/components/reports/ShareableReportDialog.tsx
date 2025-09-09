import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Calendar, Eye, Lock, Globe } from "lucide-react";

interface ShareableReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: any) => void;
  reportTitle: string;
  reportDescription: string;
}

export const ShareableReportDialog = ({
  open,
  onOpenChange,
  onGenerate,
  reportTitle,
  reportDescription
}: ShareableReportDialogProps) => {
  const [config, setConfig] = useState({
    title: reportTitle,
    description: reportDescription,
    expiresInDays: 30,
    includeAnalytics: true,
    customBranding: {
      primaryColor: '#F39C12',
      agentName: '',
      contactInfo: ''
    }
  });

  const handleGenerate = () => {
    onGenerate(config);
  };

  const expirationOptions = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 0, label: 'Never expires' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Create Client-Facing Report
          </DialogTitle>
          <DialogDescription>
            Generate a professional, branded report that you can share with clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Configuration</CardTitle>
              <CardDescription>Customize your client-facing report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input
                  id="reportTitle"
                  value={config.title}
                  onChange={(e) => setConfig({...config, title: e.target.value})}
                  placeholder="e.g., Carmichael Market Report - January 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  placeholder="Brief description of what this report contains..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link Expiration</Label>
                  <Select 
                    value={config.expiresInDays.toString()} 
                    onValueChange={(value) => setConfig({...config, expiresInDays: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expirationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          <div className="flex items-center gap-2">
                            {option.value === 0 ? <Globe className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Include Analytics</Label>
                    <p className="text-xs text-muted-foreground">Add view tracking and engagement metrics</p>
                  </div>
                  <Switch
                    checked={config.includeAnalytics}
                    onCheckedChange={(checked) => setConfig({...config, includeAnalytics: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Branding & Contact</CardTitle>
              <CardDescription>Customize how your information appears on the report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name (override)</Label>
                <Input
                  id="agentName"
                  value={config.customBranding.agentName}
                  onChange={(e) => setConfig({
                    ...config, 
                    customBranding: {...config.customBranding, agentName: e.target.value}
                  })}
                  placeholder="Leave blank to use profile name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactInfo">Contact Information</Label>
                <Textarea
                  id="contactInfo"
                  value={config.customBranding.contactInfo}
                  onChange={(e) => setConfig({
                    ...config, 
                    customBranding: {...config.customBranding, contactInfo: e.target.value}
                  })}
                  placeholder="Phone: (555) 123-4567&#10;Email: agent@example.com&#10;Website: www.example.com"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Report Title:</span>
                  <span className="text-sm">{config.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expiration:</span>
                  <Badge variant="outline">
                    {config.expiresInDays === 0 ? 'Never expires' : `${config.expiresInDays} days`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analytics:</span>
                  <Badge variant={config.includeAnalytics ? "default" : "secondary"}>
                    {config.includeAnalytics ? 'Included' : 'Not included'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="gap-2">
              <Share2 className="h-4 w-4" />
              Generate Shareable Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};