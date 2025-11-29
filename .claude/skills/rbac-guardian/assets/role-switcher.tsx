'use client';

import { useState } from 'react';
import { useRole, Role } from './role-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  User,
  Shield,
  Crown,
  Eye,
  Edit,
  Palette,
  Settings,
  Users,
  Briefcase,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Icon Mapping - Extensible for any icon names from database
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  shield: Shield,
  user: User,
  users: Users,
  eye: Eye,
  edit: Edit,
  palette: Palette,
  settings: Settings,
  briefcase: Briefcase,
  star: Star,
  zap: Zap,
  // Add more icons as needed
};

function getRoleIcon(iconName?: string) {
  if (!iconName) return User;
  const normalizedName = iconName.toLowerCase().replace(/[^a-z]/g, '');
  return ICON_MAP[normalizedName] || User;
}

// ============================================================================
// Color Generation - Dynamic based on hierarchy or database field
// ============================================================================

const HIERARCHY_COLORS = [
  'bg-gradient-to-r from-purple-600 to-indigo-600',  // 90-100
  'bg-gradient-to-r from-blue-600 to-cyan-600',      // 70-89
  'bg-gradient-to-r from-green-600 to-emerald-600',  // 50-69
  'bg-gradient-to-r from-orange-600 to-amber-600',   // 30-49
  'bg-gradient-to-r from-gray-500 to-slate-500',     // 0-29
];

function getRoleColor(role: Role): string {
  // Use database color if available
  if (role.color) return role.color;

  // Generate based on hierarchy
  const hierarchy = role.hierarchy ?? 50;
  if (hierarchy >= 90) return HIERARCHY_COLORS[0];
  if (hierarchy >= 70) return HIERARCHY_COLORS[1];
  if (hierarchy >= 50) return HIERARCHY_COLORS[2];
  if (hierarchy >= 30) return HIERARCHY_COLORS[3];
  return HIERARCHY_COLORS[4];
}

// ============================================================================
// Main Role Switcher Component
// ============================================================================

interface RoleSwitcherProps {
  className?: string;
  /** Show simulation badge */
  showBadge?: boolean;
  /** Compact mode for sidebars */
  compact?: boolean;
  /** Custom trigger button */
  trigger?: React.ReactNode;
}

export function RoleSwitcher({
  className,
  showBadge = true,
  compact = false,
  trigger,
}: RoleSwitcherProps) {
  const {
    activeRole,
    actualRole,
    availableRoles,
    switchRole,
    resetRole,
    canSwitchRoles,
    isSimulating,
    isLoading,
    error,
  } = useRole();

  const [isOpen, setIsOpen] = useState(false);

  // Don't render if user cannot switch roles
  if (!canSwitchRoles) return null;

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" disabled className={cn("gap-2", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span className="hidden sm:inline">Loading roles...</span>}
      </Button>
    );
  }

  // Error state
  if (error || !activeRole) {
    return (
      <Button variant="outline" disabled className={cn("gap-2 text-destructive", className)}>
        <AlertCircle className="w-4 h-4" />
        {!compact && <span className="hidden sm:inline">Error</span>}
      </Button>
    );
  }

  const RoleIcon = getRoleIcon(activeRole.icon);
  const roleColor = getRoleColor(activeRole);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Simulation Status Badge */}
      {showBadge && isSimulating && !compact && (
        <Badge
          variant="outline"
          className={cn(
            "hidden md:flex items-center gap-1.5",
            "animate-pulse border-amber-500/50 text-amber-600",
            "bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
          )}
        >
          <AlertCircle className="w-3 h-3" />
          <span>Viewing as {activeRole.display_name}</span>
        </Badge>
      )}

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                "gap-2 transition-all duration-200",
                isSimulating && [
                  "ring-2 ring-amber-500/30",
                  "border-amber-500/50",
                  "hover:border-amber-500",
                ]
              )}
            >
              {/* Role Icon */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full",
                  compact ? "w-5 h-5" : "w-6 h-6",
                  roleColor
                )}
              >
                <RoleIcon className={cn("text-white", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
              </div>

              {/* Role Name */}
              {!compact && (
                <span className="hidden sm:inline font-medium">
                  {activeRole.display_name}
                </span>
              )}

              {/* Dropdown Arrow */}
              <ChevronDown
                className={cn(
                  "opacity-50 transition-transform duration-200",
                  compact ? "w-3 h-3" : "w-4 h-4",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
          {/* Header */}
          <DropdownMenuLabel className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Switch Role View</p>
              <p className="text-xs text-muted-foreground font-normal">
                Explore the platform as different roles
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {availableRoles.length} roles
            </Badge>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Dynamic Role List */}
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {availableRoles.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No roles found</p>
              </div>
            ) : (
              availableRoles.map((role) => {
                const Icon = getRoleIcon(role.icon);
                const color = getRoleColor(role);
                const isActive = role.id === activeRole.id;
                const isActual = role.id === actualRole?.id;

                return (
                  <DropdownMenuItem
                    key={role.id}
                    onClick={() => {
                      switchRole(role.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer py-3 px-3 mx-1 rounded-md",
                      "transition-colors duration-150",
                      isActive && "bg-accent",
                      !isActive && "hover:bg-muted/50"
                    )}
                  >
                    {/* Role Icon Circle */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        "shadow-sm transition-transform duration-200",
                        color,
                        isActive && "scale-105 ring-2 ring-primary/20"
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Role Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {role.display_name}
                        </p>
                        {isActual && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 shrink-0 border-primary/50 text-primary"
                          >
                            Your Role
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {role.description}
                        </p>
                      )}
                      {role.permissions && role.permissions.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Active Check */}
                    {isActive && (
                      <div className="shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>

          {/* Reset Button (only when simulating) */}
          {isSimulating && actualRole && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  resetRole();
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 py-3 px-3 mx-1 rounded-md cursor-pointer",
                  "text-amber-600 hover:text-amber-700",
                  "hover:bg-amber-50 dark:hover:bg-amber-950/30"
                )}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Reset to {actualRole.display_name}</p>
                  <p className="text-xs opacity-70">Return to your actual role</p>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// Compact Version for Sidebars/Mobile
// ============================================================================

export function RoleSwitcherCompact() {
  return <RoleSwitcher compact showBadge={false} />;
}

// ============================================================================
// Simulation Banner - Show at top of page when simulating
// ============================================================================

export function SimulationBanner({ className }: { className?: string }) {
  const { isSimulating, activeRole, actualRole, resetRole } = useRole();

  if (!isSimulating || !activeRole) return null;

  const RoleIcon = getRoleIcon(activeRole.icon);

  return (
    <div
      className={cn(
        "bg-amber-50 dark:bg-amber-950/30",
        "border-b border-amber-200 dark:border-amber-800",
        "px-4 py-2",
        className
      )}
    >
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", getRoleColor(activeRole))}>
            <RoleIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm">
            You are viewing the platform as{' '}
            <strong>{activeRole.display_name}</strong>.
            Some features may be hidden or restricted.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetRole}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset to {actualRole?.display_name}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Role Badge - Shows current role inline
// ============================================================================

export function RoleBadge({ className }: { className?: string }) {
  const { activeRole, isSimulating } = useRole();

  if (!activeRole) return null;

  const RoleIcon = getRoleIcon(activeRole.icon);

  return (
    <Badge
      variant={isSimulating ? "outline" : "secondary"}
      className={cn(
        "gap-1.5",
        isSimulating && "border-amber-500/50 text-amber-600 bg-amber-50",
        className
      )}
    >
      <RoleIcon className="w-3 h-3" />
      {activeRole.display_name}
    </Badge>
  );
}
