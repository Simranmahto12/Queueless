import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Flame, 
  Bell, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'heatmap' | 'settings'>('overview');

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Q
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">QueueLess</h1>
              <span className="text-xs text-slate-400 font-medium">Institution Console</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Live Queue & Counters
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'heatmap'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-4 h-4" />
              Crowd Heatmap
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings & Taxonomy
            </button>
          </nav>
        </div>

        {/* User Badge */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700">
            AD
          </div>
          <div className="flex-1 truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">Institution Admin</p>
            <p className="text-[11px] text-slate-400 truncate">Metro Central Branch</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Branch</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-semibold text-slate-900">Main Facility</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              System Live
            </span>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Active In Queue</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <span className="text-xs text-slate-400 mt-1 inline-block">Across 6 departments</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Avg. Wait Time</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900">11.4 min</p>
              <span className="text-xs text-emerald-600 mt-1 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Within 15 min SLA
              </span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Counters Online</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">8 / 10</p>
              <span className="text-xs text-slate-400 mt-1 inline-block">2 on scheduled break</span>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Lobby Occupancy</span>
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">64%</p>
              <span className="text-xs text-slate-400 mt-1 inline-block">Zone status: Moderate</span>
            </div>
          </div>

          {/* Quick Architecture Notice */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <h2 className="font-semibold text-base mb-1">QueueLess Admin Architecture Initialized</h2>
            <p className="text-sm text-blue-800">
              The dashboard foundation is wired to the shared contracts (<code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">@queueless/shared</code>).
              Member 2 can now independently flesh out live queue dispatcher tables, occupancy heatmaps, and staffing recommendations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
