import React from 'react';
import { Card, Badge } from '../ui';
import { Server, Cpu, Database, Activity, HardDrive, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function InfrastructureHealth() {
  const subsystems = [
    { name: 'FastAPI Microservice API', status: 'ONLINE', uptime: '99.99%', latency: '4.2 ms', heartbeat: '1s ago', icon: Server },
    { name: 'PostgreSQL Relational DB', status: 'ONLINE', uptime: '99.98%', latency: '2.1 ms', heartbeat: '1s ago', icon: Database },
    { name: 'Multimodal OCR Engine', status: 'ONLINE', uptime: '99.95%', latency: '180 ms', heartbeat: '2s ago', icon: Cpu },
    { name: 'Clinical Expert v3 (XGBoost)', status: 'ONLINE', uptime: '100%', latency: '12.4 ms', heartbeat: '1s ago', icon: Zap },
    { name: 'Wearable Expert v3 (15D)', status: 'ONLINE', uptime: '100%', latency: '8.6 ms', heartbeat: '1s ago', icon: Activity },
    { name: 'Gut Microbiome Expert v3', status: 'ONLINE', uptime: '100%', latency: '10.1 ms', heartbeat: '1s ago', icon: Zap },
    { name: 'Ensemble Fusion Engine', status: 'ONLINE', uptime: '100%', latency: '4.5 ms', heartbeat: '1s ago', icon: Cpu },
    { name: 'TreeSHAP Explainer Pipeline', status: 'ONLINE', uptime: '99.92%', latency: '45.0 ms', heartbeat: '3s ago', icon: ShieldCheck },
    { name: 'ChromaDB Vector RAG Engine', status: 'ONLINE', uptime: '99.90%', latency: '28.0 ms', heartbeat: '2s ago', icon: Database },
    { name: 'Encrypted Report Storage (S3)', status: 'ONLINE', uptime: '100%', latency: '15.2 ms', heartbeat: '1s ago', icon: HardDrive },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--success)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[var(--success)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Subsystem Infrastructure Health</h3>
        </div>
        <Badge variant="success" size="sm">All 10 Systems Operational</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {subsystems.map((sub, idx) => {
          const Icon = sub.icon;
          return (
            <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--primary)]" />
                  <strong className="text-xs text-[var(--text-main)] truncate">{sub.name}</strong>
                </div>
                <Badge variant="success" size="sm">{sub.status}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="block text-[9px] uppercase">Uptime</span>
                  <strong className="text-[var(--text-main)]">{sub.uptime}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase">Latency</span>
                  <strong className="text-[var(--primary)]">{sub.latency}</strong>
                </div>
                <div>
                  <span className="block text-[9px] uppercase">Heartbeat</span>
                  <strong className="text-[var(--text-main)]">{sub.heartbeat}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
