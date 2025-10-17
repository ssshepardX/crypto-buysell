import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const Navbar = () => {
  return (
    <header className="w-full p-4 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          CryptoSignals
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost">Pricing</Button>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/login">
            <Button>Register</Button>
          </Link>
          <Button variant="outline" size="icon">
            <Globe className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;