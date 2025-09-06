import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface TabItem {
  value: string
  label: string
  icon?: LucideIcon
  badge?: string | number
  disabled?: boolean
}

interface EnhancedTabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  tabs: TabItem[]
  children: React.ReactNode
  className?: string
  mobileSelectClassName?: string
}

export function EnhancedTabs({
  defaultValue,
  value,
  onValueChange,
  tabs,
  children,
  className,
  mobileSelectClassName
}: EnhancedTabsProps) {
  const isMobile = useIsMobile()
  
  return (
    <Tabs 
      defaultValue={defaultValue} 
      value={value} 
      onValueChange={onValueChange} 
      className={cn("space-y-4", className)}
    >
      {isMobile ? (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={cn("w-full h-12", mobileSelectClassName)}>
            <SelectValue>
              {tabs.find(tab => tab.value === value) && (() => {
                const currentTab = tabs.find(tab => tab.value === value)!
                return (
                  <div className="flex items-center gap-2">
                    {currentTab.icon && <currentTab.icon className="h-4 w-4" />}
                    <span>{currentTab.label}</span>
                    {currentTab.badge && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {currentTab.badge}
                      </Badge>
                    )}
                  </div>
                )
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-elevated">
            {tabs.map((tab) => (
              <SelectItem 
                key={tab.value} 
                value={tab.value} 
                disabled={tab.disabled}
                className="py-3"
              >
                <div className="flex items-center gap-2 w-full">
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="outline" className="text-xs">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="overflow-x-auto pb-2 scroll-smooth">
          <TabsList className={cn("flex w-max min-w-full h-12 p-1", tabs.length > 4 && "lg:w-auto")}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className="flex-shrink-0 px-4 py-2.5 min-w-[80px] relative"
              >
                <div className="flex items-center gap-2">
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      )}
      
      {children}
    </Tabs>
  )
}

export { TabsContent }