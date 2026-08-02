import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import TrustSection from '../components/landing/TrustSection';
import PlatformShowcase from '../components/landing/PlatformShowcase';
import Stats from '../components/landing/Stats';
import Workflow from '../components/landing/Workflow';
import Technology from '../components/landing/Technology';
import Research from '../components/landing/Research';
import Testimonials from '../components/landing/Testimonials';
import FAQSection from '../components/landing/FAQSection';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function HomePage({ user, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--primary)] selection:text-white">
      <Navbar user={user} onOpenAuth={onOpenAuth} />
      <main>
        <Hero onOpenAuth={onOpenAuth} />
        <TrustSection />
        <PlatformShowcase />
        <Stats />
        <Workflow />
        <Technology />
        <Research />
        <Testimonials />
        <FAQSection />
        <CTA onOpenAuth={onOpenAuth} />
      </main>
      <Footer />
    </div>
  );
}
