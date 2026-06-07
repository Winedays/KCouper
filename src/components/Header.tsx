import React, { useState } from "react";
import { Github, Mail, FileText, Clock, ArrowRightLeft, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import TourButton from "./TourButton";
import AnnouncementButton from "./AnnouncementButton";
import FaqDialog from "./FaqDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  lastUpdate?: string;
};

/**
 * Navigation link item definition
 */
type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
};

const Header = ({ lastUpdate }: HeaderProps) => {
  const [open, setOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      href: "v1/index.html",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      label: "舊版",
    },
    {
      href: "https://github.com/Winedays/KCouper/blob/master/CHANGELOG.md",
      icon: <FileText className="h-4 w-4" />,
      label: "更新日誌",
    },
    {
      href: "mailto:adlerau.work@gmail.com",
      icon: <Mail className="h-4 w-4" />,
      label: "聯絡我們",
    },
    {
      href: "https://github.com/Winedays/KCouper",
      icon: <Github className="h-4 w-4" />,
      label: "GitHub",
      external: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-lg font-black text-primary-foreground">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-gradient">KCouper</span>
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>更新:</span>
              <span>{lastUpdate}</span>
            </div>
          )}
          {navItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <a
                href={item.href}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                title={item.label}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
              {index === 0 && <AnnouncementButton />}
            </React.Fragment>
          ))}
          <FaqDialog />
          <TourButton />
          <div data-tour="theme-toggle">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="flex lg:hidden items-center gap-2">
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{lastUpdate}</span>
            </div>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="開啟選單">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-left">選單</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4">
                {navItems.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <a
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={() => setOpen(false)}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                    {index === 0 && <AnnouncementButton variant="menu-item" />}
                  </React.Fragment>
                ))}
                <FaqDialog variant="menu-item" />
                <TourButton showLabel variant="menu-item" onBeforeStart={() => setOpen(false)} />
                <div data-tour="theme-toggle">
                  <ThemeToggle variant="menu-item" label="主題切換" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
