import React, { useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Input, TextArea, Button, Alert } from '../components/ui';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage({ user, onOpenAuth }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)]">
      <Navbar user={user} onOpenAuth={onOpenAuth} />
      
      <main className="pt-28 pb-20">
        <PageContainer className="space-y-12">
          <PageHeader
            title="Contact & Support Center"
            description="Have questions about our multimodal AI predictions or physician clinical integration? Reach out to our technical team."
            badge="Get in Touch"
          />

          <ContentSection title="Send Us a Message" subtitle="Our clinical AI support team typically responds within 2 business hours">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              <div className="md:col-span-7">
                <Card isGlass={true} className="p-8 space-y-6">
                  {submitted ? (
                    <Alert variant="success" className="p-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
                        <div>
                          <strong className="text-base block">Message Sent Successfully!</strong>
                          <p className="text-xs text-[var(--text-muted)] mt-1">Thank you for reaching out. A clinical platform specialist will contact you shortly.</p>
                        </div>
                      </div>
                    </Alert>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Full Name" placeholder="Dr. Sarah Jenkins" required />
                        <Input label="Email Address" type="email" placeholder="sarah@hospital.org" required />
                      </div>
                      <Input label="Organization / Hospital" placeholder="Apollo Medical Center" />
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Message</label>
                        <TextArea rows={4} placeholder="Inquire about clinical integration, API access, or research collaboration..." required />
                      </div>
                      <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
                        Submit Inquiry
                      </Button>
                    </form>
                  )}
                </Card>
              </div>

              <div className="md:col-span-5 space-y-4">
                <Card isGlass={true} className="p-6 space-y-3 border-l-4 border-l-[var(--primary)]">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[var(--primary)]" />
                    <div>
                      <h4 className="text-xs font-mono text-[var(--text-muted)] uppercase">Email Support</h4>
                      <strong className="text-sm text-[var(--text-main)]">support@telemed.ai</strong>
                    </div>
                  </div>
                </Card>

                <Card isGlass={true} className="p-6 space-y-3 border-l-4 border-l-[var(--secondary)]">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[var(--secondary)]" />
                    <div>
                      <h4 className="text-xs font-mono text-[var(--text-muted)] uppercase">Clinical Helpline</h4>
                      <strong className="text-sm text-[var(--text-main)]">+1 (800) 555-TELEMED</strong>
                    </div>
                  </div>
                </Card>

                <Card isGlass={true} className="p-6 space-y-3 border-l-4 border-l-[var(--accent)]">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[var(--accent)]" />
                    <div>
                      <h4 className="text-xs font-mono text-[var(--text-muted)] uppercase">Headquarters</h4>
                      <strong className="text-sm text-[var(--text-main)]">Silicon Valley Medical AI Hub, CA</strong>
                    </div>
                  </div>
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
