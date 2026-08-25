import { useState, useEffect } from 'react';

export type RoutePath = '/' | '/simulator' | '/about-model' | '/overview' | '/dashboard';

export interface RouteState {
  path: RoutePath;
  scenarioId?: string;
}

export function normalizePath(pathname: string): RoutePath {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (clean === '/simulator' || clean.startsWith('/simulator')) {
    return '/simulator';
  }
  if (clean === '/dashboard' || clean.startsWith('/dashboard')) {
    return '/simulator';
  }
  if (clean === '/about-model' || clean.startsWith('/about-model')) {
    return '/about-model';
  }
  if (clean === '/overview' || clean.startsWith('/overview')) {
    return '/overview';
  }
  return '/';
}

export function parseLocation(): RouteState {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const scenarioId = searchParams.get('scenario') || undefined;

  const path = normalizePath(pathname);
  return { path, scenarioId };
}

export function navigate(to: RoutePath, params?: { scenario?: string }) {
  let url = to as string;
  if (params?.scenario) {
    url += `?scenario=${encodeURIComponent(params.scenario)}`;
  }

  if (typeof window !== 'undefined') {
    if (window.location.pathname + window.location.search !== url) {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }
}

export function useRouter(): RouteState & { navigate: typeof navigate } {
  const [route, setRoute] = useState<RouteState>(() => parseLocation());

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    ...route,
    navigate,
  };
}
