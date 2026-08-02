import React from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge } from '../components/ui';
import { ShieldCheck, Heart, Users, Award, Sparkles } from 'lucide-react';

export default function AboutPage({ user, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)]">
      <Navbar user={user} onOpenAuth={onOpenAuth} />
      
      <main className="pt-28 pb-20">
        <PageContainer className="space-y-12">
          <PageHeader
            title="About TeleMed AI Platform"
            description="Pioneering Explainable Multimodal Artificial Intelligence for Early Disease Risk Detection"
            badge="Mission & Vision"
          />

          <ContentSection title="Our Mission" subtitle="Transforming reactive treatment into proactive, explainable precision health">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <Card isGlass={true} className="p-8 space-y-4 border-l-4 border-l-[var(--primary)]">
                <Badge variant="primary" size="sm">PATIENT-CENTRIC AI</Badge>
                <h3 className="text-2xl font-extrabold text-[var(--text-main)]">Predictive Health Decoded</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  TeleMed AI bridges the gap between complex biochemical lab reports, continuous wearable telemetry, and gut microbiome sequencing. Our platform transforms raw diagnostic data into transparent, actionable risk insights for both patients and clinicians.
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card isGlass={true} className="p-5 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-[var(--primary)]" />
                  <div className="text-lg font-bold text-[var(--text-main)]">HIPAA & GDPR</div>
                  <p className="text-xs text-[var(--text-muted)]">Encrypted & Compliant</p>
                </Card>
                <Card isGlass={true} className="p-5 text-center space-y-2">
                  <Award className="w-8 h-8 mx-auto text-[var(--secondary)]" />
                  <div className="text-lg font-bold text-[var(--text-main)]">95% Accuracy</div>
                  <p className="text-xs text-[var(--text-muted)]">Calibrated Ensembles</p>
                </Card>
                <Card isGlass={true} className="p-5 text-center space-y-2">
                  <Users className="w-8 h-8 mx-auto text-[var(--accent)]" />
                  <div className="text-lg font-bold text-[var(--text-main)]">1,240+ Patients</div>
                  <p className="text-xs text-[var(--text-muted)]">Active Assessments</p>
                </Card>
                <Card isGlass={true} className="p-5 text-center space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-rose-500" />
                  <div className="text-lg font-bold text-[var(--text-main)]">48+ Physicians</div>
                  <p className="text-xs text-[var(--text-muted)]">Verified Doctors</p>
                </Card>
              </div>
            </div>
          </ContentSection>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
