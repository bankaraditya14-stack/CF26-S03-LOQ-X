import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { InteractiveHoverButton } from '../InteractiveHoverButton';

describe('InteractiveHoverButton Component', () => {
  it('renders default button text and structural elements correctly', () => {
    const html = renderToString(<InteractiveHoverButton text="LAUNCH SIMULATOR" />);
    
    expect(html).toContain('LAUNCH SIMULATOR');
    expect(html).toContain('group');
    expect(html).toContain('rounded-full');
    expect(html).toContain('translate-x-12');
  });

  it('renders with custom text or children', () => {
    const html = renderToString(
      <InteractiveHoverButton>
        <span>CUSTOM ACTION</span>
      </InteractiveHoverButton>
    );

    expect(html).toContain('CUSTOM ACTION');
  });

  it('applies custom className correctly', () => {
    const html = renderToString(
      <InteractiveHoverButton text="LAUNCH SIMULATOR" className="custom-test-class" />
    );

    expect(html).toContain('custom-test-class');
  });
});
