import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// ============================================================================
// ADMOB OFFICIAL GOOGLE ANDROID TEST IDs
// Replace these constants with your official production IDs when you deploy!
// ============================================================================
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';
export const ADMOB_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';

// Check if running on a native platform (Android/iOS)
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initializes AdMob inside the application.
 * Must be called early in the app loading logic.
 */
export const initializeAdMob = async (): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      console.log('[AdMob] Initializing native AdMob with App ID:', ADMOB_ANDROID_APP_ID);
      await AdMob.initialize({
        initializeForTesting: true,
      });
      console.log('[AdMob] Native AdMob Initialized successfully.');
      return true;
    } else {
      console.log('[AdMob Web Simulator] AdMob Initialized with App ID:', ADMOB_ANDROID_APP_ID);
      return true;
    }
  } catch (error) {
    console.error('[AdMob] Failed to initialize AdMob:', error);
    return false;
  }
};

/**
 * Displays the Banner Ad at the bottom of the screen.
 * On Web, triggers a simulated banner state.
 */
export const showBannerAd = async (onWebShowCallback?: (visible: boolean) => void): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      console.log('[AdMob] Showing native Banner Ad:', ADMOB_BANNER_AD_UNIT_ID);
      await AdMob.showBanner({
        adId: ADMOB_BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 50, // Avoid bottom multi-sheet tabs overlap on mobile screens
        isTesting: true,
      });
      return true;
    } else {
      console.log('[AdMob Web Simulator] Dispalying mock banner at bottom.');
      if (onWebShowCallback) {
        onWebShowCallback(true);
      }
      return true;
    }
  } catch (error) {
    console.error('[AdMob] Error showing Banner Ad:', error);
    return false;
  }
};

/**
 * Hides/Destroys the Banner Ad.
 */
export const hideBannerAd = async (onWebHideCallback?: (visible: boolean) => void): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      console.log('[AdMob] Hiding native Banner Ad.');
      await AdMob.hideBanner();
      return true;
    } else {
      console.log('[AdMob Web Simulator] Mock banner hidden.');
      if (onWebHideCallback) {
        onWebHideCallback(false);
      }
      return true;
    }
  } catch (error) {
    console.error('[AdMob] Error hiding Banner Ad:', error);
    return false;
  }
};

/**
 * Prepares and displays an Interstitial Ad.
 * This will run right after a user successfully clicks and exports an Excel/CSV file.
 */
export const triggerInterstitialAd = async (onWebShowCallback?: () => void): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      console.log('[AdMob] Preparing Interstitial Ad:', ADMOB_INTERSTITIAL_AD_UNIT_ID);
      await AdMob.prepareInterstitial({
        adId: ADMOB_INTERSTITIAL_AD_UNIT_ID,
        isTesting: true,
      });
      console.log('[AdMob] Displaying native Interstitial Ad.');
      await AdMob.showInterstitial();
      return true;
    } else {
      console.log('[AdMob Web Simulator] Displaying mock Interstitial Ad.');
      if (onWebShowCallback) {
        onWebShowCallback();
      }
      return true;
    }
  } catch (error) {
    console.error('[AdMob] Error triggering Interstitial Ad:', error);
    return false;
  }
};
