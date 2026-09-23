"use client"

import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    LogOut,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

export interface NavUserProps {
    user: {
        email: string
        username: string
        roles: string[]
        profile: {
            firstName: string
            lastName: string
            profileImage?: string
        }
    }
    variant?: "header" | "sidebar"
}

export function NavUser({
    user,
    variant = "header",
}: NavUserProps) {
    const { isMobile } = useSidebar()
    const { logout } = useAuth()
    const navigate = useNavigate()

    const initials = `${user.profile.firstName?.[0] || ''}${user.profile.lastName?.[0] || ''}`.toUpperCase() || 'U'
    const fullName = `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.username
    const primaryRole = user.roles?.[0]?.replace('_', ' ') || 'User'

    if (variant === "sidebar") {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-white/10 data-[state=open]:text-white"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.profile.profileImage ?? ""} alt={fullName} />
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{fullName}</span>
                                    <span className="truncate text-xs">{user.username}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user.profile.profileImage ?? ""} alt={fullName} />
                                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{fullName}</span>
                                        <span className="truncate text-xs">{user.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                                    <BadgeCheck />
                                    Account
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-700">
                                <LogOut />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    // Default "header" layout variant for persistent top navigation
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    id="top-navbar-user-trigger"
                    type="button"
                    className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-all border border-slate-200/80 bg-white/90 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 group cursor-pointer"
                    aria-label="User profile menu"
                >
                    <Avatar className="h-8 w-8 rounded-full ring-1 ring-slate-200 shadow-xs">
                        <AvatarImage src={user.profile.profileImage ?? ""} alt={fullName} />
                        <AvatarFallback className="rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left text-xs leading-tight hidden sm:flex">
                        <span className="truncate font-semibold text-slate-800 group-hover:text-primary transition-colors max-w-[130px]">
                            {fullName}
                        </span>
                        <span className="truncate text-slate-500 text-[11px] max-w-[130px]">
                            {user.email || user.username}
                        </span>
                    </div>
                    <ChevronsUpDown className="size-3.5 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 rounded-xl shadow-xl border-slate-200 p-1.5 z-50 bg-white"
                side="bottom"
                align="end"
                sideOffset={8}
            >
                <DropdownMenuLabel className="p-2 font-normal">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-full ring-2 ring-primary/20">
                            <AvatarImage src={user.profile.profileImage ?? ""} alt={fullName} />
                            <AvatarFallback className="rounded-full bg-primary/10 text-primary font-bold text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-xs leading-tight overflow-hidden">
                            <span className="truncate font-semibold text-slate-900 text-sm">
                                {fullName}
                            </span>
                            <span className="truncate text-slate-500 text-xs">{user.email}</span>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                                    {primaryRole}
                                </span>
                            </div>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={() => navigate('/settings')}
                        className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <BadgeCheck className="size-4 text-slate-500" />
                        <span className="text-sm font-medium">Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
                        <Bell className="size-4 text-slate-500" />
                        <span className="text-sm font-medium">Notifications</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700 transition-colors font-medium"
                >
                    <LogOut className="size-4 text-rose-600" />
                    <span className="text-sm">Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
