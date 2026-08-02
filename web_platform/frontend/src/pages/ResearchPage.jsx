import React from 'react';
import Navbar from '../components/landing/Navbar';
import Technology from '../components/landing/Technology';
import Research from '../components/landing/Research';
import Footer from '../components/landing/Footer';
import { PageHeader, PageContainer } from '../components/layout';

export default function ResearchPage({ user, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)]">
      <Navbar user={user} onOpenAuth={onOpenAuth} />
      
      <main className="pt-28 pb-20">
        <PageContainer className="space-y-12">
          <PageHeader
            title="Scientific Research & Technology Architecture"
            description="Deep dive into our Multimodal Stacking Ensembles, TreeSHAP Game-Theoretic Explainers, and ChromaDB Medical RAG Knowledge Base"
            badge="Science & Tech Stack"
          />

          <Research />
          <Technology />
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
