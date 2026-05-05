import AppShell from '@/components/AppShell';
import Head from '@/components/Head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['1. Acceptance', 'By using Shepard AI, you agree to these terms and to use the service only for lawful purposes.'],
  ['2. Service', 'Shepard AI provides crypto market movement analysis, anomaly classification, and risk context. It does not provide financial advice or recommendations to buy or sell assets.'],
  ['3. User responsibility', 'You are responsible for account security and for how you use market information. Crypto markets are volatile and external data can change quickly.'],
  ['4. Data accuracy', 'We aim to provide useful analysis, but market data, third-party sources, and AI summaries may be incomplete, delayed, or wrong.'],
  ['5. Availability', 'The service may be unavailable during maintenance, provider outages, or infrastructure incidents.'],
  ['6. Billing', 'Paid plans are processed through our payment provider. Plan access updates after payment confirmation or webhook processing.'],
  ['7. Liability', 'Shepard AI is not liable for indirect, incidental, consequential, or financial losses related to use of the service.'],
  ['8. Contact', 'Questions about these terms can be sent to support@shepardai.pro.'],
];

const Terms = () => {
  return (
    <AppShell title="Terms of Service" subtitle="Service rules and risk notice.">
      <Head
        title="Terms of Service - Shepard AI"
        description="Terms of service for Shepard AI crypto movement intelligence."
        path="/terms"
      />
      <div className="mx-auto max-w-4xl space-y-4">
        {sections.map(([title, body]) => (
          <Card key={title} className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-slate-400">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};

export default Terms;
