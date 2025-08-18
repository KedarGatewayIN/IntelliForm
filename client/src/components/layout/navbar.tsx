import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  PlusIcon,
  ChevronDownIcon,
  LayoutDashboard,
  Clock,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { usePathname } from "wouter/use-browser-location";
import clsx from "clsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recent", label: "Recent", icon: Clock },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/todo", label: "Todo", icon: CheckCircle },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">
                IntelliForm
              </span>
            </Link>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-2 font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="relative inline-flex items-center">
                      {item.label}
                      {item.href === "/todo" && (user?.todoCount ?? 0) > 0 ? (
                        <span className="ml-2 relative">
                          <span className="absolute -top-2 -right-4 flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                            <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold shadow-md border-2 border-white">
                              {user?.todoCount! > 99 ? "99+" : user?.todoCount}
                            </span>
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/forms/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Form
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.username}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
