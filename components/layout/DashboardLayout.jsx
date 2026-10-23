"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { WorkspaceProvider } from "./WorkspaceContext";

/**
 * DashboardLayout wraps the entire dashboard page with
 * the fixed sidebar + sticky top navbar + scrollable content area.
 */
export default function DashboardLayout({ children }) {
  return (
    <WorkspaceProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <TopNavbar />
        {/* Main content: offset by sidebar width + navbar height */}
        <main className="ml-[220px] pt-[60px] min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}

