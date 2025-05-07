"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Logo } from "@/components/icons"
import { ThemeSwitch } from "@/components/theme-switch"
import { Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Progress } from "@heroui/react"
import { Menu, X, Bell, User, Settings, LogOut, Home, LayoutGrid, ScrollText, LineChart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type SideNavItem = {
  title: string
  href: string
  icon: React.ReactNode
}

const sideNavItems: SideNavItem[] = [
  {
    title: "Dashboard",
    href: "/client",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Projects",
    href: "/client/projects",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  {
    title: "Templates",
    href: "/client/templates",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/client/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)

      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setSidebarCollapsed(true)
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isActive = (path: string) => {
    if (path === "/client" && pathname === "/client") return true
    return pathname.startsWith(path) && path !== "/client"
  }

  const toggleSidebar = () => {
    if (window.innerWidth >= 768) {
      setSidebarCollapsed(!sidebarCollapsed)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-divider transition-all duration-300 ease-in-out bg-background ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "w-20" : "w-64"} md:relative md:translate-x-0`}
      >
        <div className="flex h-14 items-center justify-between border-b border-divider px-4">
          <Link
            href="/client"
            className={`flex items-center gap-2 ${sidebarCollapsed && !isMobileView ? "justify-center" : ""}`}
          >
            <Logo className="h-8 w-8 text-primary" />
            {(!sidebarCollapsed || isMobileView) && (
              <span className="text-xl font-semibold text-foreground">Halogen</span>
            )}
          </Link>
          {(!sidebarCollapsed || isMobileView) && (
            <Button isIconOnly variant="light" size="sm" className="md:flex" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {sideNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50 ${
                    isActive(item.href) ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground"
                  } ${sidebarCollapsed && !isMobileView ? "justify-center" : ""}`}
                >
                  {item.icon}
                  {(!sidebarCollapsed || isMobileView) && <span>{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-divider p-4">
          <div
            className={`flex ${sidebarCollapsed && !isMobileView ? "justify-center" : "items-center gap-3"} rounded-lg px-3 py-2`}
          >
            {!sidebarCollapsed || isMobileView ? (
              <>
                <LineChart className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Storage</div>
                  <Progress value={49} className="h-1.5 my-1" color="primary" />
                  <div className="flex justify-between text-xs">
                    <span>24.5GB</span>
                    <span>50GB</span>
                  </div>
                </div>
              </>
            ) : (
              <LineChart className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>

        {sidebarCollapsed && (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="absolute -right-3 top-20 hidden h-6 w-6 rounded-full border shadow-sm md:flex"
            onClick={toggleSidebar}
          >
            <Menu className="h-3 w-3" />
          </Button>
        )}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-divider bg-card/50 px-4 backdrop-blur">
          <div className="flex items-center">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="ml-4 text-lg font-semibold text-foreground md:text-xl">
              {sideNavItems.find((item) => isActive(item.href))?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {mounted && <ThemeSwitch />}

            <Button isIconOnly variant="light" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>

            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" className="rounded-full">
                  <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem key="profile-info" className="h-14 gap-2" textValue="Profile info">
                  <div className="flex items-center gap-2">
                    <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="h-9 w-9" />
                    <div>
                      <p className="text-sm font-medium">Sarah Connor</p>
                      <p className="text-xs text-muted-foreground">sarah@skynet.com</p>
                    </div>
                  </div>
                </DropdownItem>
                <DropdownItem key="profile" textValue="Profile" startContent={<User className="h-4 w-4" />}>
                  Profile
                </DropdownItem>
                <DropdownItem key="settings" textValue="Settings" startContent={<Settings className="h-4 w-4" />}>
                  Settings
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  textValue="Logout"
                  startContent={<LogOut className="h-4 w-4" />}
                  className="text-danger"
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background/50 p-4">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
