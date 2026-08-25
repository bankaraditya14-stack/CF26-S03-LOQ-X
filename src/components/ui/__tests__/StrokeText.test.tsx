import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StrokeText } from '../StrokeText';

describe('StrokeText Component', () => {
  it('renders with default props and text', () => {
    const html = renderToString(<StrokeText text="Predict the Cascade." />);
    expect(html).toContain('Predict the Cascade.');
    expect(html).toContain('stroke-text');
    expect(html).toContain('stroke-text__svg');
  });

  it('renders individual characters as tspans', () => {
    const html = renderToString(
      <StrokeText text="CASCADE" strokeColor="#7E7497" fillColor="#7E7497" />
    );
    expect(html).toContain('data-stroke-char');
    expect(html).toContain('data-fill-char');
    expect(html).toContain('CASCADE');
  });

  it('applies custom className and style props', () => {
    const html = renderToString(
      <StrokeText
        text="Test"
        className="custom-stroke-class"
        style={{ opacity: 0.9 }}
      />
    );
    expect(html).toContain('custom-stroke-class');
    expect(html).toContain('opacity:0.9');
  });
});
