import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export const APP_SCHEME = 'com.shepardai.app';
export const isNativeApp = () => Capacitor.isNativePlatform();

export const mobileRedirectUrl = (path = '/auth/callback') => `${APP_SCHEME}://${path.replace(/^\//, '')}`;

export async function openExternalUrl(url: string) {
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return;
  }
  window.location.href = url;
}
