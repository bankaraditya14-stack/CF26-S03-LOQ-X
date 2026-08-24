import { useState, useEffect } from 'react';

export type RoutePath = '/' | '/simulator' | '/about-model';

export interface RouteState {
  path: RoutePath;
  scenarioId?: string;
}

function parseLocation(): RouteState {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const scenarioId = searchParams.get('scenario') || undefined;

  let path: RoutePath = '/';
  if (pathname === '/simulator' || pathname.startsWith('/simulator')) {
    path = '/simulator';
  } else if (pathname === '/about-model' || pathname.startsWith('/about-model')) {
    path = '/about-model';
  }

  return { path, scenarioId };
}

export function navigate(to: RoutePath, params?: { scenario?: string }) {
  let url = to as string;
  if (params?.scenario) {
    url += `?scenario=${encodeURIComponent(params.scenario)}`;
  }

  if (window.location.pathname + window.location.search !== url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
