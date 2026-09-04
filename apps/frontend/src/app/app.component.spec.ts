import { shouldMinimizeChatDrag } from './app.component';

describe('mobile assistant drag gesture', () => {
  it('minimizes after the distance threshold', () => {
    expect(shouldMinimizeChatDrag(96, 500)).toBeTrue();
  });

  it('minimizes a deliberate fast downward gesture', () => {
    expect(shouldMinimizeChatDrag(42, 50)).toBeTrue();
  });

  it('returns the panel for short or upward gestures', () => {
    expect(shouldMinimizeChatDrag(23, 20)).toBeFalse();
    expect(shouldMinimizeChatDrag(-120, 80)).toBeFalse();
  });
});
