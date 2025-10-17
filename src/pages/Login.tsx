import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSession } from "@/contexts/SessionContext";

const Login = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="dark"
          localization={{
            variables: {
              sign_up: {
                email_label: 'E-posta adresi',
                password_label: 'Şifre oluştur',
                button_label: 'Kayıt Ol',
                social_provider_text: '{{provider}} ile giriş yap',
                link_text: 'Hesabın yok mu? Kayıt Ol',
              },
              sign_in: {
                email_label: 'E-posta adresi',
                password_label: 'Şifreniz',
                button_label: 'Giriş Yap',
                social_provider_text: '{{provider}} ile giriş yap',
                link_text: 'Zaten bir hesabın var mı? Giriş Yap',
              },
              forgotten_password: {
                email_label: 'E-posta adresi',
                password_label: 'Şifreniz',
                button_label: 'Şifre sıfırlama linki gönder',
                link_text: 'Şifreni mi unuttun?',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;