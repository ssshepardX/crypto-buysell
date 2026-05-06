import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp } from '@/lib/mobile';

export function registerMobileAuthHandler() {
  if (!isNativeApp()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith('com.shepardai.app://')) return;

    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    const next = parsed.searchParams.get('next') || '/dashboard';

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      await Browser.close().catch(() => undefined);
      window.location.assign(next.startsWith('/') ? next : '/dashboard');
      return;
    }

    const error = parsed.searchParams.get('error_description') || parsed.searchParams.get('error');
    if (error) {
      await Browser.close().catch(() => undefined);
      window.location.assign(`/login?error=${encodeURIComponent(error)}`);
    }
  });
}
