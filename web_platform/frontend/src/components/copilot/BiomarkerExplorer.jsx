import React, { useState } from 'react';
import { Card, Badge, Input } from '../ui';
import { Search, Activity, Filter, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function BiomarkerExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('ALL');

  const biomarkers = [
    { id: 'BIO-1', name: 'HbA1c Glycated Hemoglobin', current: '5.8%', previous: '6.1%', trend: 'IMPROVED', refRange: '4.0 - 5.6%', status: 'BORDERLINE', modality: 'Clinical', interp: 'Glycemic control improved over 90 days.' },
    { id: 'BIO-2', name: 'Fasting Blood Glucose', current: '105 mg/dL', previous: '112 mg/dL', trend: 'IMPROVED', refRange: '70 - 99 mg/dL', status: 'BORDERLINE', modality: 'Clinical', interp: 'Borderline elevated, monitoring recommended.' },
    { id: 'BIO-3', name: 'HRV RMSSD', current: '42 ms', previous: '34 ms', trend: 'IMPROVED', refRange: '>35 ms', status: 'OPTIMAL', modality: 'Wearable', interp: 'Strong autonomic nervous system tone.' },
    { id: 'BIO-4', name: 'Resting Heart Rate', current: '64 bpm', previous: '68 bpm', trend: 'IMPROVED', refRange: '60 - 100 bpm', status: 'OPTIMAL', modality: 'Wearable', interp: 'Normal resting cardiovascular rate.' },
    { id: 'BIO-5', name: 'Bifidobacterium Taxa', current: '4.2%', previous: '3.1%', trend: 'IMPROVED', refRange: '3.0 - 8.0%', status: 'OPTIMAL', modality: 'Gut', interp: 'Healthy SCFA gut flora abundance.' },
  ];

  const filteredBiomarkers = biomarkers.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMod = selectedModality === 'ALL' || b.modality === selectedModality;
    return matchesSearch && matchesMod;
  });

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--accent)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Biomarker Intelligence Explorer</h3>
        </div>
        <Badge variant="accent" size="sm">{filteredBiomarkers.length} Tracked</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search biomarker name or ID..."
          leftIcon={<Search className="w-4 h-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={selectedModality}
          onChange={(e) => setSelectedModality(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold"
        >
          <option value="ALL">All Modalities</option>
          <option value="Clinical">Clinical</option>
          <option value="Wearable">Wearable</option>
          <option value="Gut">Gut</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {filteredBiomarkers.map((b) => (
          <div key={b.id} className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-xs text-[var(--text-main)] block">{b.name}</strong>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{b.modality} • Ref: {b.refRange}</span>
              </div>
              <Badge variant={b.status === 'OPTIMAL' ? 'success' : 'warning'} size="sm">{b.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono p-2 rounded bg-[var(--bg-surface)]">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] block uppercase">Current</span>
                <strong className="text-[var(--text-main)]">{b.current}</strong>
              </div>
              <div>
                <span className="text-[9px] text-[var(--text-muted)] block uppercase">Previous</span>
                <span className="text-[var(--text-muted)]">{b.previous}</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">"{b.interp}"</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
