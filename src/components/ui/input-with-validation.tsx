import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface InputWithValidationProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: string;
  loading?: boolean;
}

const InputWithValidation = React.forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({ className, error, success, loading, type, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          type={type}
          className={cn(
            className,
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-green-500 focus-visible:ring-green-500"
          )}
          ref={ref}
          {...props}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
        {success && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 mt-1">{success}</p>
        )}
      </div>
    );
  }
);
InputWithValidation.displayName = "InputWithValidation";

export { InputWithValidation };