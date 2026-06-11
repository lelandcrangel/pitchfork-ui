import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { composeDescribedBy, getFocusableElements, isActivationKey, Keys } from './index';

describe('getFocusableElements', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // jsdom has no layout: offsetParent is always null and getClientRects()
    // is always empty. Pretend elements are laid out unless a test opts out.
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  const hideFromLayout = (element: HTMLElement) => {
    Object.defineProperty(element, 'offsetParent', { get: () => null });
  };

  it('collects standard focusable elements and skips disabled/aria-hidden ones', () => {
    container.innerHTML = `
      <a href="#x">link</a>
      <button>ok</button>
      <button disabled>nope</button>
      <input aria-hidden="true" />
      <div tabindex="0">stop</div>
      <div tabindex="-1">skip</div>
    `;

    const found = getFocusableElements(container).map((el) => el.tagName.toLowerCase());
    expect(found).toEqual(['a', 'button', 'div']);
  });

  it('includes contenteditable="" and contenteditable="true" but not "false"', () => {
    container.innerHTML = `
      <div id="empty" contenteditable></div>
      <div id="true" contenteditable="true"></div>
      <div id="false" contenteditable="false"></div>
    `;

    const ids = getFocusableElements(container).map((el) => el.id);
    expect(ids).toEqual(['empty', 'true']);
  });

  it('keeps position:fixed elements whose offsetParent is null but which have client rects', () => {
    container.innerHTML = `<div id="fixed" tabindex="0"></div>`;
    const fixed = container.querySelector<HTMLElement>('#fixed')!;
    // Browser behavior for position:fixed: no offsetParent, but laid out.
    hideFromLayout(fixed);
    fixed.getClientRects = () => [{ width: 100, height: 40 }] as unknown as DOMRectList;

    expect(getFocusableElements(container)).toEqual([fixed]);
  });

  it('drops elements that are not rendered at all (no offsetParent, no rects)', () => {
    container.innerHTML = `<button id="hidden">x</button>`;
    const hidden = container.querySelector<HTMLElement>('#hidden')!;
    hideFromLayout(hidden); // display:none-like: jsdom rects are already empty

    expect(getFocusableElements(container)).toEqual([]);
  });

  it('prefers checkVisibility() when the platform provides it', () => {
    container.innerHTML = `<button id="cv">x</button>`;
    const cv = container.querySelector<HTMLElement>('#cv')!;
    // offsetParent says visible (mocked to body), but checkVisibility wins.
    cv.checkVisibility = () => false;

    expect(getFocusableElements(container)).toEqual([]);
  });
});

describe('a11y helpers', () => {
  it('isActivationKey accepts Enter and Space only', () => {
    expect(isActivationKey(Keys.Enter)).toBe(true);
    expect(isActivationKey(Keys.Space)).toBe(true);
    expect(isActivationKey(Keys.Escape)).toBe(false);
  });

  it('composeDescribedBy joins truthy ids and returns undefined when empty', () => {
    expect(composeDescribedBy('a', undefined, 'b', false, null)).toBe('a b');
    expect(composeDescribedBy(undefined, null)).toBeUndefined();
  });
});
