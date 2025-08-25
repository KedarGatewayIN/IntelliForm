import { ReactNode } from "react";
import VerticalNavigation from "./vertical-navigation";

interface AppLayoutProps {
  children?: ReactNode;
  showThreeColumns?: boolean;
  middleColumn?: ReactNode;
  rightColumn?: ReactNode;
}

export default function AppLayout({ 
  children, 
  showThreeColumns = false, 
  middleColumn, 
  rightColumn 
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* First Column - Vertical Navigation (Always visible) */}
      <div className="w-16 bg-white border-r border-gray-200 flex-shrink-0">
        <VerticalNavigation />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {showThreeColumns ? (
          <>
            {/* Second Column */}
            <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
              {middleColumn}
            </div>
            
            {/* Third Column */}
            <div className="flex-1 bg-white">
              {rightColumn}
            </div>
          </>
        ) : (
          /* Two Column Layout */
          <div className="flex-1 bg-white">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}