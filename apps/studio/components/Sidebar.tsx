import Image from "next/image";
import { Inter } from "next/font/google";
import SidebarItem from "./SidebarItem";
import HomeIcon from "./icons/home";
import ProjectsIcon from "./icons/projects";
import UserPlusIcon from "./icons/invite";
import RecordIcon from "./icons/record";
import RocketIcon from "./icons/rocket";
import PartyPopperIcon from "./icons/party";
import GearIcon from "./icons/settings";

const inter = Inter({ subsets: ['latin'] });
export const Sidebar = () => {
    return (
      <aside className="flex h-screen w-20 flex-col items-center border-r bg-background py-4">
        <div className="mb-6">
          <Image src="/logo.svg" alt="logo" width={40} height={40} />
        </div>
  
        <nav className="flex flex-1 flex-col gap-1">
          <ul className="flex flex-col gap-1">
            <SidebarItem href="/" label="Dashboard" icon={<HomeIcon hovered={false} size={24} />} />
            <SidebarItem href="/projects" label="Projects" icon={<ProjectsIcon hovered={false} size={24} />} />
            <SidebarItem href="/invitations" label="Invite" icon={<UserPlusIcon hovered={false} size={24} />} />
            <SidebarItem href="/recording-rules" label="Record" icon={<RecordIcon hovered={false} size={24} />} />
          </ul>
  
          <div className="flex-1" />
  
          <ul className="flex flex-col gap-1">
            <SidebarItem href="/upgrade" label="Upgrade" icon={<RocketIcon hovered={false} size={24} />} />
            <SidebarItem href="/whats-new" label="What's New" icon={<PartyPopperIcon hovered={false} size={24} />} />
            <SidebarItem href="/settings" label="Settings" icon={<GearIcon hovered={false} size={24} />} />
          </ul>
        </nav>
      </aside>
    );
  };
  
