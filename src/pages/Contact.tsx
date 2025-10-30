import Navbar from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Linkedin, MapPin, Heart } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg bg-secondary/50 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Get in Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 p-3 rounded-md transition-colors hover:bg-primary/10">
              <Github className="h-6 w-6 text-muted-foreground" />
              <a 
                href="https://github.com/ssshepardX" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                github.com/ssshepardX
              </a>
            </div>
            <div className="flex items-center space-x-4 p-3 rounded-md transition-colors hover:bg-primary/10">
              <Linkedin className="h-6 w-6 text-muted-foreground" />
              <a 
                href="https://www.linkedin.com/in/furkancoban1337" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                linkedin.com/in/furkancoban1337
              </a>
            </div>
            <div className="flex items-center space-x-4 p-3 rounded-md">
              <MapPin className="h-6 w-6 text-muted-foreground" />
              <p className="font-medium">
                Allendestraße 34, Schmalkalden, DE
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center items-center pt-6">
            <p className="text-muted-foreground flex items-center">
              Made with <Heart className="h-4 w-4 mx-1.5 text-red-500 fill-red-500" /> by Furkan Çoban
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Contact;