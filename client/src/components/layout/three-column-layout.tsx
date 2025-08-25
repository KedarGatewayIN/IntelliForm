import { ReactNode } from "react";
import SidebarNavigation from "./sidebar-navigation";

interface ThreeColumnLayoutProps {
  children: ReactNode;
  secondColumn?: ReactNode;
  thirdColumn?: ReactNode;
  showThirdColumn?: boolean;
}

export default function ThreeColumnLayout({
  children,
  secondColumn,
  thirdColumn,
  showThirdColumn = false,
}: ThreeColumnLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* First Column - Vertical Navigation */}
      <SidebarNavigation />

      {/* Second Column */}
      <div className={`${showThirdColumn ? "w-80" : "flex-1"} bg-white border-r border-gray-200`}>
        {secondColumn || children}
      </div>

      {/* Third Column */}
      {showThirdColumn && thirdColumn && (
        <div className="flex-1 bg-white">
          {thirdColumn}
        </div>
      )}
    </div>
  );
}