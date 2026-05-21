import { describe, expect, it } from 'vitest';
import * as BadgeStories from './Badge.stories';
import * as ButtonStories from './Button.stories';
import * as CardStories from './Card.stories';
import * as CheckboxStories from './Checkbox.stories';
import * as FoundationsStories from './Foundations.stories';
import * as InputStories from './Input.stories';
import * as SwitchStories from './Switch.stories';

describe('storybook project stories', () => {
  it('loads core story modules', () => {
    expect(BadgeStories.default).toBeDefined();
    expect(ButtonStories.default).toBeDefined();
    expect(CardStories.default).toBeDefined();
    expect(CheckboxStories.default).toBeDefined();
    expect(FoundationsStories.default).toBeDefined();
    expect(InputStories.default).toBeDefined();
    expect(SwitchStories.default).toBeDefined();
  });

  it('contains a single CssCheck story export', () => {
    expect(ButtonStories.CssCheck).toBeDefined();
  });
});
