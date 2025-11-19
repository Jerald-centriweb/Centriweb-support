import React from 'react';
import { useFeature } from '../contexts/TenantContext';
import { TenantConfig } from '../types/tenant';

interface FeatureGateProps {
  feature: keyof TenantConfig['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * FeatureGate - Conditionally render content based on tenant feature flags
 *
 * Usage:
 * <FeatureGate feature="badges">
 *   <BadgeSystem />
 * </FeatureGate>
 *
 * With fallback:
 * <FeatureGate feature="whisperVoice" fallback={<WebSpeechInput />}>
 *   <WhisperInput />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback = null }) => {
  const isEnabled = useFeature(feature);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to conditionally execute logic based on feature flag
 *
 * Usage:
 * const handleAction = useFeatureGate('advancedGameification', () => {
 *   // Logic only runs if feature is enabled
 *   triggerAdvancedBadge();
 * });
 */
export const useFeatureGate = <T extends any[]>(
  feature: keyof TenantConfig['features'],
  callback: (...args: T) => void
): ((...args: T) => void) => {
  const isEnabled = useFeature(feature);

  return (...args: T) => {
    if (isEnabled) {
      callback(...args);
    }
  };
};

/**
 * Higher-order component to wrap entire components in feature gate
 *
 * Usage:
 * export const BadgeSystemPage = withFeatureGate('badges')(BadgeSystemPageComponent);
 */
export const withFeatureGate = (feature: keyof TenantConfig['features'], fallback?: React.ComponentType) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    const WrappedComponent: React.FC<P> = (props) => {
      const isEnabled = useFeature(feature);

      if (!isEnabled) {
        return fallback ? React.createElement(fallback, props) : null;
      }

      return <Component {...props} />;
    };

    WrappedComponent.displayName = `withFeatureGate(${Component.displayName || Component.name})`;
    return WrappedComponent;
  };
};
