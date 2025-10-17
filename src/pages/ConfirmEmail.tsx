import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error';

const ConfirmEmail = () => {
  const [status, setStatus] = useState<Status>('verifying');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000); // 3 saniye sonra yönlendir
      }
    });

    // Eğer bir süre sonra hala session yoksa hata olarak kabul et
    const timer = setTimeout(() => {
        if (status === 'verifying') {
            setStatus('error');
        }
    }, 10000); // 10 saniye timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate, status]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <CardTitle>E-posta Adresiniz Doğrulanıyor...</CardTitle>
            <p className="text-muted-foreground mt-2">Lütfen bekleyin, bu işlem birkaç saniye sürebilir.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <CardTitle>Doğrulama Başarılı!</CardTitle>
            <p className="text-muted-foreground mt-2">Hesabınız başarıyla aktive edildi. Kontrol paneline yönlendiriliyorsunuz...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <CardTitle>Doğrulama Başarısız</CardTitle>
            <p className="text-muted-foreground mt-2">
              Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir. Lütfen tekrar giriş yapmayı deneyin veya yeni bir doğrulama e-postası isteyin.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader />
        <CardContent className="p-8">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;