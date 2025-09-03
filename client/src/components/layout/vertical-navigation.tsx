import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  CheckSquare, 
  Bug, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    id: "forms",
    label: "Forms",
    icon: FileText,
    href: "/forms",
  },
  {
    id: "new-form",
    label: "New Form",
    icon: Plus,
    href: "/forms/new",
  },
  {
    id: "todo",
    label: "Todo",
    icon: CheckSquare,
    href: "/todo",
  },
  {
    id: "bugs",
    label: "Bugs",
    icon: Bug,
    href: "/bugs",
  },
];

const bottomItems = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
  },
];

export default function VerticalNavigation() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Navigation Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-12 h-12 p-0 mx-auto flex items-center justify-center",
                        "hover:bg-blue-50 hover:text-blue-600",
                        active && "bg-blue-100 text-blue-600"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom Items (Profile) */}
      <div className="pb-4">
        <nav className="space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-12 h-12 p-0 mx-auto flex items-center justify-center",
                        "hover:bg-blue-50 hover:text-blue-600",
                        active && "bg-blue-100 text-blue-600"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </div>
  );
}