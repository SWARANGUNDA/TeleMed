import React from 'react';
import { Card, Badge } from '../ui';
import { HeartPulse, Utensils, Activity, Moon, Stethoscope, ShieldCheck } from 'lucide-react';

export default function PersonalizedRecommendations() {
  const categories = [
    {
      group: 'Nutrition & Diet',
      icon: Utensils,
      items: ['Increase soluble dietary fiber (25-30g/day)', 'Incorporate low glycemic index whole grains', 'Maintain evening fasting window of 12 hours'],
      badge: 'HIGH PRIORITY',
      variant: 'danger',
    },
    {
      group: 'Physical Activity',
      icon: Activity,
      items: ['Engage in 150 mins/week moderate aerobic activity', 'Add 2 days of resistance strength training', 'Post-meal 10-minute light walking'],
      badge: 'MEDIUM PRIORITY',
      variant: 'warning',
    },
    {
      group: 'Sleep & Circadian Alignment',
      icon: Moon,
      items: ['Maintain consistent 10:30 PM sleep schedule', 'Avoid blue light exposure 60 mins before sleep', 'Target 7.5-8.0 hours continuous sleep'],
      badge: 'RECOMMENDED',
      variant: 'primary',
    },
    {
      group: 'Clinical Follow-Up',
      icon: Stethoscope,
      items: ['Schedule 90-day repeat HbA1c & lipid panel', 'Review wearable telemetry trends with Dr. Vance'],
      badge: 'CLINICAL ACTION',
      variant: 'secondary',
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Personalized Health Recommendations</h3>
        </div>
        <Badge variant="primary" size="sm">Evidence-Based Guidelines</Badge>
      </div>

      <div className="space-y-4 text-xs">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--primary)]" />
                  <strong className="text-xs text-[var(--text-main)]">{cat.group}</strong>
                </div>
                <Badge variant={cat.variant} size="sm">{cat.badge}</Badge>
              </div>

              <ul className="space-y-1 pl-6 list-disc text-[11px] text-[var(--text-muted)] leading-relaxed">
                {cat.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
