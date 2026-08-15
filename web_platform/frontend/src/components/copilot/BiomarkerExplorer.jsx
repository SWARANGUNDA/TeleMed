import React, { useState } from 'react';
import { Card, Badge, Input } from '../ui';
import { Search, Activity, Filter, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function BiomarkerExplorer({ predictionData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('ALL');

  const clinFeats = predictionData?.confirmed_features?.clinical || predictionData?.clinical_features || {};
  const wearFeats = predictionData?.confirmed_features?.wearable || predictionData?.wearable_features || {};
  const gutFeats = predictionData?.confirmed_features?.gut || predictionData?.gut_features || {};

  const biomarkers = predictionData ? [
    ...Object.keys(clinFeats).map((k, idx) => ({
      id: `CLIN-${idx + 1}`,
      name: k.replace(/_/g, ' '),
      current: `${clinFeats[k]}`,
      previous: 'Baseline',
      trend: 'ESTABLISHED',
      refRange: 'Canonical',
      status: 'CONFIRMED',
      modality: 'Clinical',
      interp: `Clinical feature extracted from lab intake. Value: ${clinFeats[k]}`
    })),
    ...Object.keys(wearFeats).map((k, idx) => ({
      id: `WEAR-${idx + 1}`,
      name: k.replace(/_/g, ' '),
      current: `${wearFeats[k]}`,
      previous: 'Baseline',
      trend: 'ESTABLISHED',
      refRange: 'Telemetry',
      status: 'CONFIRMED',
      modality: 'Wearable',
      interp: `Wearable telemetry feature extracted. Value: ${wearFeats[k]}`
    })),
    ...Object.keys(gutFeats).map((k, idx) => ({
      id: `GUT-${idx + 1}`,
      name: k.replace(/_/g, ' '),
      current: `${gutFeats[k]}`,
      previous: 'Baseline',
      trend: 'ESTABLISHED',
      refRange: 'Abundance',
      status: 'CONFIRMED',
      modality: 'Gut',
      interp: `Gut microbiome taxon relative abundance: ${gutFeats[k]}`
    }))
  ] : [];

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
