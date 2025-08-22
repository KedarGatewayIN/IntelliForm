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
  FileText,
} from "lucide-react";
import { usePathname } from "wouter/use-browser-location";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    Array<
      | { type: "form"; id: string; title: string; description?: string | null }
      | {
          type: "submission";
          id: string;
          formId: string;
          title: string | null;
          snippet?: string | null;
        }
      | {
          type: "ai_conversation";
          id: string;
          submissionId: string;
          formId: string;
          title: string | null;
          snippet?: string | null;
        }
    >
  >([]);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/submissions", label: "Submissions", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/todo", label: "Todo", icon: CheckCircle },
  ];

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const resp = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
          {
            credentials: "include",
            signal: ac.signal,
          },
        );
        if (!resp.ok) {
          setResults([]);
        } else {
          const json = await resp.json();
          setResults(json.results ?? []);
        }
      } catch (_e) {
        // ignore aborts/errors silently for UX
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
            <nav className="hidden md:ml-10 md:flex items-center gap-2">
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
                      "flex items-center gap-2 font-medium transition-colors px-3 py-2 rounded-md",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
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

          <div className="flex items-center space-x-4" ref={containerRef}>
            <div className="relative w-96 lg:w-40 hidden md:block">
              <Input
                type="text"
                className="pl-10"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  setOpen(!!val);
                }}
                placeholder="Search…"
                onFocus={() => setOpen(query.length > 0)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {open && (
                <div
                  className={cn(
                    "absolute mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl z-50 max-h-96 overflow-auto",
                    loading ? "opacity-100" : "",
                  )}
                >
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {loading
                      ? "Searching…"
                      : results.length === 0
                        ? "No results"
                        : "Results"}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {results.map((r) => {
                      if (r.type === "form") {
                        return (
                          <li
                            key={`form-${r.id}`}
                            className="px-3 py-2 hover:bg-gray-50"
                          >
                            <Link
                              href={`/forms/${r.id}/edit`}
                              className="flex flex-col"
                              onClick={() => {
                                setOpen(false);
                                setQuery("");
                              }}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                Form • {r.title}
                              </span>
                              {r.description ? (
                                <span className="text-xs text-gray-600 line-clamp-1">
                                  {r.description}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      }
                      if (r.type === "submission") {
                        return (
                          <li
                            key={`sub-${r.id}`}
                            className="px-3 py-2 hover:bg-gray-50"
                          >
                            <Link
                              href={`/forms/${r.formId}/responses/${r.id}`}
                              className="flex flex-col"
                              onClick={() => {
                                setOpen(false);
                                setQuery("");
                              }}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                Submission • {r.title ?? "Untitled form"}
                              </span>
                              {r.snippet ? (
                                <span className="text-xs text-gray-600 line-clamp-1">
                                  {r.snippet}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={`ai-${r.id}`}
                          className="px-3 py-2 hover:bg-gray-50"
                        >
                          <Link
                            href={`/forms/${r.formId}/responses/${r.submissionId}`}
                            className="flex flex-col"
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                          >
                            <span className="text-sm font-medium text-gray-900">
                              AI Conversation • {r.title ?? "Untitled form"}
                            </span>
                            {r.snippet ? (
                              <span className="text-xs text-gray-600 line-clamp-1">
                                {r.snippet}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
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
