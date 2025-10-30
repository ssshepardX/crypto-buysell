import Navbar from "@/components/Navbar";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          This is the contact page. A contact form or contact information will be displayed here.
        </p>
      </main>
    </div>
  );
};

export default Contact;