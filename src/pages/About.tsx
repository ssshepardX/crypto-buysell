import AppShell from '@/components/AppShell';
import Head from '@/components/Head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: 'What Shepard AI does',
    body: 'Shepard AI explains unusual crypto market movement. It checks price action, volume, liquidity, whale traces, and public catalyst signals to show why a coin may be moving.',
  },
  {
    title: 'How analysis works',
    body: 'The system calculates indicators and risk scores first. AI is used only to turn the result into a short, plain-language summary. This keeps the output consistent and reduces unnecessary model cost.',
  },
  {
    title: 'What it is not',
    body: 'Shepard AI does not provide buy or sell instructions. It is a market intelligence tool for understanding movement source, manipulation risk, and data confidence.',
  },
];

const About = () => {
  return (
    <AppShell title="About Shepard AI" subtitle="Market movement intelligence, not trade signals.">
      <Head
        title="About - Shepard AI"
        description="Learn how Shepard AI explains crypto market movement, whale traces, liquidity risk, and news or social catalysts."
        path="/about"
      />
      <div className="mx-auto max-w-4xl space-y-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-slate-400">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};

export default About;
