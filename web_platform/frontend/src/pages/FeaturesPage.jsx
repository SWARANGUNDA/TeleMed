import React from 'react';
import Navbar from '../components/landing/Navbar';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';
import { PageHeader, PageContainer } from '../components/layout';

export default function FeaturesPage({ user, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)]">
      <Navbar user={user} onOpenAuth={onOpenAuth} />
      
      <main className="pt-28 pb-20">
        <PageContainer className="space-y-12">
          <PageHeader
            title="Platform Features & Capabilities"
            description="Explore our Clinical OCR, Wearable Sensors, Microbiome Sequencing, TreeSHAP Explainability, and Doctor Consultation Workspaces"
            badge="Full Feature Breakdown"
          />

          <Features />
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
