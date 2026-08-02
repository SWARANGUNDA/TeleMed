import React from 'react';
import { Card, Badge, CircularProgress } from '../ui';
import { Heart, Activity, Moon, Zap, Utensils, Dna } from 'lucide-react';

export default function WellnessScorecards() {
  const scorecards = [
    { title: 'Metabolic Health', score: 90, icon: Activity, trend: '+5 pts', rec: 'HbA1c 5.8% optimal', variant: 'success' },
    { title: 'Cardiovascular Health', score: 86, icon: Heart, trend: '+3 pts', rec: 'BP 118/78 mmHg', variant: 'success' },
    { title: 'Sleep Quality', score: 88, icon: Moon, trend: '+8 pts', rec: '7.5 hours deep sleep', variant: 'primary' },
    { title: 'Physical Activity', score: 82, icon: Zap, trend: '+4 pts', rec: '8,500 daily steps', variant: 'primary' },
    { title: 'Nutrition Balance', score: 85, icon: Utensils, trend: '+2 pts', rec: 'Low glycemic intake', variant: 'accent' },
    { title: 'Gut Microbiome', score: 84, icon: Dna, trend: '+6 pts', rec: 'SCFA taxa diversity', variant: 'accent' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--secondary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">6 Wellness Domain Scorecards</h3>
        </div>
        <Badge variant="secondary" size="sm">Overall 88/100</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {scorecards.map((sc, idx) => {
          const Icon = sc.icon;
          return (
            <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="font-semibold text-[var(--text-main)] text-[11px] truncate">{sc.title}</span>
              </div>
              <div className="text-xl font-extrabold font-mono text-[var(--text-main)]">{sc.score} / 100</div>
              <span className="text-[10px] font-mono text-[var(--success)] font-bold block">{sc.trend}</span>
              <p className="text-[9px] text-[var(--text-muted)] truncate">{sc.rec}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
