import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="w-full p-4 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          CryptoSignals
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/pricing">
            <Button variant="ghost">Fiyatlandırma</Button>
          </Link>
          {session ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button onClick={handleLogout}>Çıkış Yap</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Giriş Yap</Button>
              </Link>
              <Link to="/login">
                <Button>Kayıt Ol</Button>
              </Link>
            </>
          )}
          <Button variant="outline" size="icon">
            <Globe className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;