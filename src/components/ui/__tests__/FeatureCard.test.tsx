import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FeatureCard } from '../FeatureCard';

describe('FeatureCard Component', () => {
  it('renders title, description and icon container properly', () => {
    const html = renderToString(
      <FeatureCard
        icon={<span data-testid="icon">⚡</span>}
        title="Test Feature"
        description="A detailed test description for feature card."
        badge="STEP 1"
      />
    );

    expect(html).toContain('Test Feature');
    expect(html).toContain('A detailed test description for feature card.');
    expect(html).toContain('STEP 1');
    expect(html).toContain('hover:-translate-y-2');
  });

  it('applies custom className correctly', () => {
    const html = renderToString(
      <FeatureCard
        icon={<span>⚡</span>}
        title="Custom Card"
        description="Custom description"
        className="custom-feature-card-class"
      />
    );

    expect(html).toContain('custom-feature-card-class');
  });
});
