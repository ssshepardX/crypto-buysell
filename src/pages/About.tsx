import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-left space-y-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              About Shepard Signals
            </h1>
            <p className="text-lg text-muted-foreground">
              The Future of Automated Crypto Analysis
            </p>
          </div>

          <div className="p-6 bg-secondary/50 rounded-lg border border-white/10">
            <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the volatile and complex world of cryptocurrency, timely and accurate information is the key to success. Shepard Signals was founded on a simple principle: to empower traders of all levels by providing clear, data-driven, and actionable insights. We cut through the market noise, so you can focus on making strategic decisions.
            </p>
          </div>

          <div className="p-6 bg-secondary/50 rounded-lg border border-white/10">
            <h2 className="text-2xl font-bold mb-3">A Hybrid Intelligence Approach</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our system represents the optimal fusion of proven technical analysis and state-of-the-art artificial intelligence. We don't rely on one or the other; we leverage the strengths of both. Our algorithms first use established technical indicators like HMA and RSI to identify potential high-probability trade setups. Then, our AI engine analyzes these signals in a broader market context to confirm their validity, assess risk, and generate realistic take-profit targets. This hybrid model ensures our signals are not just theoretical but practical and grounded in real market dynamics.
            </p>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-md font-semibold text-foreground">
              Proudly created in Germany, with a commitment to precision and reliability.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;