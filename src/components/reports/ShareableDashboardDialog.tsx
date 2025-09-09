import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, Home, Users, DollarSign, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ShareableDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: any) => void;
  analyticsData: any;
}

const availableMetrics = [
  {
    id: 'market_trends',
    label: 'Market Trends',
    description: 'Price and inventory trends over time',
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'price_analysis',
    label: 'Price Analysis',
    description: 'Current pricing vs market averages',
    icon: <DollarSign className="h-4 w-4" />
  },
  {
    id: 'inventory_levels',
    label: 'Inventory Levels',
    description: 'Active listings and market supply',
    icon: <Home className="h-4 w-4" />
  },
  {
    id: 'days_on_market',
    label: 'Days on Market',
    description: 'How quickly properties are selling',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    id: 'neighborhood_activity',
    label: 'Neighborhood Activity',
    description: 'Local market engagement and interest',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'comparative_analysis',
    label: 'Comparative Analysis',
    description: 'Neighborhood vs county performance',
    icon: <BarChart3 className="h-4 w-4" />
  }
];

export const ShareableDashboardDialog = ({
  open,
  onOpenChange,
  onGenerate,
  analyticsData
}: ShareableDashboardDialogProps) => {
  const [config, setConfig] = useState({
    title: 'Market Dashboard',
    description: 'Your personalized real estate market insights',
    selectedMetrics: ['market_trends', 'price_analysis', 'inventory_levels'],
    dateRange: {
      start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    expiresInDays: 30,
    clientInfo: {
      name: '',
      email: '',
      propertyAddress: ''
    }
  });

  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleMetricToggle = (metricId: string, checked: boolean) => {
    if (checked) {
      setConfig({
        ...config,
        selectedMetrics: [...config.selectedMetrics, metricId]
      });
    } else {
      setConfig({
        ...config,
        selectedMetrics: config.selectedMetrics.filter(id => id !== metricId)
      });
    }
  };

  const handleDateRangeUpdate = () => {
    setConfig({
      ...config,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      }
    });
  };

  const handleGenerate = () => {
    handleDateRangeUpdate();
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Create Client Dashboard
          </DialogTitle>
          <DialogDescription>
            Generate a shareable, read-only dashboard for your clients with selected market insights
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dashboard Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboardTitle">Dashboard Title</Label>
                  <Input
                    id="dashboardTitle"
                    value={config.title}
                    onChange={(e) => setConfig({...config, title: e.target.value})}
                    placeholder="e.g., Your Market Dashboard"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboardDescription">Description</Label>
                  <Textarea
                    id="dashboardDescription"
                    value={config.description}
                    onChange={(e) => setConfig({...config, description: e.target.value})}
                    placeholder="Brief description for your client..."
                    rows={3}
                  />
                </div>

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
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Information (Optional)</CardTitle>
                <CardDescription>Personalize the dashboard for a specific client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={config.clientInfo.name}
                    onChange={(e) => setConfig({
                      ...config, 
                      clientInfo: {...config.clientInfo, name: e.target.value}
                    })}
                    placeholder="John & Jane Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={config.clientInfo.email}
                    onChange={(e) => setConfig({
                      ...config, 
                      clientInfo: {...config.clientInfo, email: e.target.value}
                    })}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    value={config.clientInfo.propertyAddress}
                    onChange={(e) => setConfig({
                      ...config, 
                      clientInfo: {...config.clientInfo, propertyAddress: e.target.value}
                    })}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Range</CardTitle>
                <CardDescription>Select the time period for analytics data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Selection Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Metrics to Include</CardTitle>
                <CardDescription>
                  Choose which analytics to display on the client dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={metric.id}
                        checked={config.selectedMetrics.includes(metric.id)}
                        onCheckedChange={(checked) => handleMetricToggle(metric.id, checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={metric.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                        >
                          {metric.icon}
                          {metric.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Dashboard Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Selected Metrics:</span>
                  <Badge>{config.selectedMetrics.length} of {availableMetrics.length}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Period:</span>
                  <span className="text-sm font-medium">
                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Access:</span>
                  <div className="flex items-center gap-1">
                    {config.expiresInDays === 0 ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    <span className="text-sm">
                      {config.expiresInDays === 0 ? 'Permanent' : 'Temporary'}
                    </span>
                  </div>
                </div>

                {config.clientInfo.name && (
                  <div className="pt-2 border-t">
                    <p className="text-sm">
                      <span className="font-medium">For:</span> {config.clientInfo.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={config.selectedMetrics.length === 0}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Generate Client Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};