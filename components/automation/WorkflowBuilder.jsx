"use client";

import { useState, useMemo } from "react";
import {
  Edit2,
  ChevronDown,
  Save,
  MoreVertical,
  Plus,
  Minus,
  Maximize2,
  Lock,
  Unlock,
  Check,
  Zap,
  Play,
  Activity,
} from "lucide-react";
import WorkflowNode from "./WorkflowNode";
import TestRunModal from "./TestRunModal";
import { getDefaultCanvas } from "@/lib/automationData";

export default function WorkflowBuilder({
  workflow = null,
  workflowName = "New Workflow",
  onNodeClick,
  onAddNodeAt,
  onUpdateWorkflow,
  onExecuteWorkflow,
}) {
  const [name, setName] = useState(workflow?.name || workflowName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isActive, setIsActive] = useState(workflow ? workflow.status === "Active" : true);
  const [zoom, setZoom] = useState(100);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState("node-cond-1");
  const [saved, setSaved] = useState(false);
  const [isTestRunOpen, setIsTestRunOpen] = useState(false);

  const parsedCanvas = useMemo(() => {
    if (!workflow?.canvas) {
      return getDefaultCanvas(workflow?.name || workflowName, workflow?.triggerType);
    }
    const c = workflow.canvas;
    if (c.trigger || c.condition || c.yesBranch || c.noBranch) {
      return c;
    }
    return getDefaultCanvas(workflow?.name || workflowName, workflow?.triggerType);
  }, [workflow]);

  const [currentCanvas, setCurrentCanvas] = useState(parsedCanvas);

  const triggerNode = currentCanvas.trigger || {
    id: "node-trig-1",
    type: "trigger",
    badge: "TRIGGER",
    title: "New Lead Created",
    icon: "user-plus",
    iconBg: "bg-purple-100 text-purple-600",
  };

  const conditionNode = currentCanvas.condition || {
    id: "node-cond-1",
    type: "condition",
    badge: "CONDITION",
    title: "Lead Score > 80",
    icon: "branch",
    iconBg: "bg-amber-100 text-amber-600",
  };

  const yesBranchNodes = currentCanvas.yesBranch || [];
  const noBranchNodes = currentCanvas.noBranch || [];

  const handleSave = async () => {
    if (onUpdateWorkflow && workflow?.id) {
      await onUpdateWorkflow(workflow.id, {
        name,
        status: isActive ? "Active" : "Paused",
        canvas: currentCanvas,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(150, Math.max(70, prev + delta)));
  };

  const handleAddActionToBranch = (branch = "yes") => {
    const newId = `node-act-${branch}-${Date.now()}`;
    const newNode = {
      id: newId,
      type: "action",
      badge: "ACTION",
      title: branch === "yes" ? "Send WhatsApp Message" : "Add to Nurture Campaign",
      actionType: branch === "yes" ? "send_whatsapp" : "add_to_campaign",
      icon: branch === "yes" ? "message-circle" : "mail",
      iconBg: branch === "yes" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600",
    };

    setCurrentCanvas((prev) => {
      if (branch === "yes") {
        return { ...prev, yesBranch: [...(prev.yesBranch || []), newNode] };
      } else {
        return { ...prev, noBranch: [...(prev.noBranch || []), newNode] };
      }
    });
  };

  const renderConnector = (onClickAdd) => (
    <div className="relative flex flex-col items-center my-2">
      <div className="w-[1.5px] h-6 bg-slate-300" />
      <button
        onClick={onClickAdd}
        className="w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:scale-110 flex items-center justify-center transition-all shadow-2xs z-10 my-0.5 cursor-pointer"
        title="Add next step"
      >
        <Plus size={11} className="stroke-[2.5]" />
      </button>
      <div className="w-[1.5px] h-6 bg-slate-300" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-full overflow-hidden relative">
      
      {/* ── Canvas Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100/90 z-20 bg-white">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 block leading-tight">
            Workflow Builder
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            {isEditingName ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
                className="text-sm font-bold text-gray-900 border-b border-indigo-500 focus:outline-none pb-0.5"
              />
            ) : (
              <h2
                onClick={() => setIsEditingName(true)}
                className="text-sm font-bold text-gray-900 tracking-tight cursor-pointer hover:text-indigo-600 flex items-center gap-1.5"
              >
                <span>{name}</span>
                <Edit2 size={13} className="text-gray-400" />
              </h2>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Test Run Button */}
          <button
            onClick={() => setIsTestRunOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Execute real test run on server engine"
          >
            <Play size={12} className="fill-emerald-600" />
            <span>Test Run</span>
          </button>

          {/* Status Toggle */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span>{isActive ? "Active" : "Paused"}</span>
            <ChevronDown size={13} className="text-gray-400 ml-0.5" />
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {saved ? <Check size={13} className="text-emerald-600" /> : <Save size={13} />}
            <span>{saved ? "Saved" : "Save"}</span>
          </button>

          {/* More Options */}
          <button
            onClick={() => setIsTestRunOpen(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            title="Workflow Options"
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* ── Interactive Workflow Canvas Area ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto p-8 relative min-h-[640px] flex justify-center items-start select-none"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
          backgroundColor: "#fafbfd",
        }}
      >
        {/* Canvas Scaled Wrapper */}
        <div
          className="flex flex-col items-center transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          
          {/* 1. TRIGGER NODE */}
          <WorkflowNode
            node={triggerNode}
            isSelected={selectedNodeId === triggerNode.id}
            onClick={() => {
              setSelectedNodeId(triggerNode.id);
              if (onNodeClick) onNodeClick(triggerNode);
            }}
          />

          {/* Connector 1 */}
          {renderConnector(() => alert("Trigger is connected to condition evaluation."))}

          {/* 2. CONDITION NODE */}
          {conditionNode && (
            <WorkflowNode
              node={conditionNode}
              isSelected={selectedNodeId === conditionNode.id}
              onClick={() => {
                setSelectedNodeId(conditionNode.id);
                if (onNodeClick) onNodeClick(conditionNode);
              }}
            />
          )}

          {/* ── Branching Split Line ────────────────────────────────────────── */}
          <div className="w-full flex flex-col items-center my-1 relative">
            <div className="w-[1.5px] h-6 bg-slate-300" />

            <div className="w-[320px] md:w-[380px] h-[1.5px] bg-slate-300 relative">
              <div className="absolute left-0 top-0 w-[1.5px] h-6 bg-slate-300" />
              <div className="absolute right-0 top-0 w-[1.5px] h-6 bg-slate-300" />
            </div>
          </div>

          {/* ── TWO BRANCH COLUMNS (YES / NO) ─────────────────────────────────── */}
          <div className="flex items-start gap-12 md:gap-16 mt-4">
            
            {/* ── LEFT BRANCH (YES) ──────────────────────────────────────────── */}
            <div className="flex flex-col items-center min-w-[210px]">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-0.5 rounded-full mb-3 shadow-2xs">
                Yes (Condition True)
              </span>

              {yesBranchNodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center">
                  <WorkflowNode
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (onNodeClick) onNodeClick(node);
                    }}
                  />
                  {index < yesBranchNodes.length - 1 &&
                    renderConnector(() => handleAddActionToBranch("yes"))}
                </div>
              ))}

              {yesBranchNodes.length > 0 && (
                <button
                  onClick={() => handleAddActionToBranch("yes")}
                  className="mt-3 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={11} /> Add Action
                </button>
              )}
            </div>

            {/* ── RIGHT BRANCH (NO) ─────────────────────────────────────────── */}
            <div className="flex flex-col items-center min-w-[210px]">
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-3 py-0.5 rounded-full mb-3 shadow-2xs">
                No (Condition False)
              </span>

              {noBranchNodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center">
                  <WorkflowNode
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (onNodeClick) onNodeClick(node);
                    }}
                  />
                  {index < noBranchNodes.length - 1 &&
                    renderConnector(() => handleAddActionToBranch("no"))}
                </div>
              ))}

              {noBranchNodes.length > 0 && (
                <button
                  onClick={() => handleAddActionToBranch("no")}
                  className="mt-3 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={11} /> Add Action
                </button>
              )}
            </div>

          </div>

          {/* ── Bottom Merging Connectors ─────────────────────────────────────── */}
          <div className="w-full flex flex-col items-center mt-6 relative">
            <div className="w-[320px] md:w-[380px] h-[1.5px] bg-slate-300 relative">
              <div className="absolute left-0 bottom-0 w-[1.5px] h-6 bg-slate-300" />
              <div className="absolute right-0 bottom-0 w-[1.5px] h-6 bg-slate-300" />
            </div>
            <div className="w-[1.5px] h-6 bg-slate-300" />

            <div className="mt-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
              Workflow Termination & Logging
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Left Zoom & View Controls ──────────────────────────────────── */}
      <div className="absolute left-5 bottom-5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-gray-200/90 rounded-xl p-1 shadow-md">
        <button
          onClick={() => handleZoom(-10)}
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom out"
        >
          <Minus size={13} />
        </button>

        <span className="text-[11px] font-bold text-gray-700 w-10 text-center font-mono">
          {zoom}%
        </span>

        <button
          onClick={() => handleZoom(10)}
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Zoom in"
        >
          <Plus size={13} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          onClick={() => setZoom(100)}
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Fit to screen"
        >
          <Maximize2 size={13} />
        </button>

        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLocked ? "text-indigo-600 bg-indigo-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          }`}
          title={isLocked ? "Unlock canvas" : "Lock canvas"}
        >
          {isLocked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>

      {/* ── Interactive Test Run Execution Modal ──────────────────────────────── */}
      <TestRunModal
        isOpen={isTestRunOpen}
        onClose={() => setIsTestRunOpen(false)}
        workflow={workflow}
        onExecute={onExecuteWorkflow}
      />

    </div>
  );
}
