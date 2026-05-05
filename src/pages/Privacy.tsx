import AppShell from '@/components/AppShell';
import Head from '@/components/Head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  ['1. Data we collect', 'We collect account email, authentication data, plan status, daily usage counters, contact messages, and technical data needed to run the service.'],
  ['2. How data is used', 'We use data to provide accounts, process subscriptions, enforce limits, improve reliability, answer support requests, and protect the platform from abuse.'],
  ['3. Market and AI data', 'Coin symbols, timeframes, computed indicators, risk scores, and short AI summaries may be stored for caching and product quality.'],
  ['4. Providers', 'The service uses infrastructure, authentication, payment, market data, analytics, and AI providers. Provider names may change as the product evolves.'],
  ['5. Cookies and storage', 'The app uses essential browser storage to keep users signed in and remember basic preferences such as language.'],
  ['6. Retention and deletion', 'We keep data only as long as needed for the product, support, legal, or security reasons. Account deletion requests can be sent to support@shepardai.pro.'],
  ['7. Contact', 'Privacy questions can be sent to support@shepardai.pro.'],
];

const Privacy = () => {
  return (
    <AppShell title="Privacy Policy" subtitle="How Shepard AI handles account and product data.">
      <Head
        title="Privacy Policy - Shepard AI"
        description="Privacy policy for Shepard AI crypto movement intelligence."
        path="/privacy"
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
        <p className="text-center text-xs text-slate-500">Last updated: May 5, 2026</p>
      </div>
    </AppShell>
  );
};

export default Privacy;
