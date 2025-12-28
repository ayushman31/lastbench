import Image from "next/image";
import { Inter } from "next/font/google";
import SidebarItem from "./SidebarItem";
import { FolderKanban, LayoutDashboard, Podcast, PartyPopper, UserRoundPlus, Wrench } from "lucide-react";

const inter = Inter({ subsets: ['latin'] });
export const Sidebar = () => {
    return (
      <aside className="flex h-screen w-20 flex-col items-center border-r bg-background py-4">
        {/* Logo */}
        <div className="mb-6">
          <Image src="/logo.svg" alt="logo" width={40} height={40} />
        </div>
  
        {/* Main nav */}
        <nav className="flex flex-1 flex-col gap-1">
          <ul className="flex flex-col gap-1">
            <SidebarItem href="/" label="Dashboard" icon={LayoutDashboard} />
            <SidebarItem href="/projects" label="Projects" icon={FolderKanban} />
            <SidebarItem href="/invitations" label="Invite" icon={UserRoundPlus} />
            <SidebarItem href="/recording-rules" label="Record" icon={Podcast} />
          </ul>
  
          {/* Spacer */}
          <div className="flex-1" />
  
          {/* Bottom nav */}
          <ul className="flex flex-col gap-1">
            <SidebarItem href="/whats-new" label="What's New" icon={PartyPopper} />
            <SidebarItem href="/settings" label="Settings" icon={Wrench} />
          </ul>
        </nav>
      </aside>
    );
  };
  
