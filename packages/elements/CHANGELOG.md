# Changelog

## [0.3.0](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-v0.2.1...elements-v0.3.0) (2026-11-09)


### ⚠ BREAKING CHANGES

* **core:** IconGlyph is now the general glyph shape rather than Font Awesome's tuple, and resolveIconGlyph returns it, including for roles and built-in glyphs. The FA tuple type is FontAwesomeIconDefinition, which getIconPaths now takes. severityIconName returns a role (info, success, warning, danger), and the components' internal <pf-icon> elements carry role names, so code reading those names sees `close` where it saw `circle-xmark`. Registering a Font Awesome definition with registerIconGlyphs works as before.

### Features

* **core:** make the icon set swappable for any library ([cf2653b](https://github.com/lelandcrangel/pitchfork-ui/commit/cf2653b403227f4fe6a0952d276db900ca68069c))


### Bug Fixes

* **elements:** stop focus scrolling the slideout's dialog mid-slide ([16a5fb4](https://github.com/lelandcrangel/pitchfork-ui/commit/16a5fb4d61bbf8afa7e31dc70a811071cf411288))
* **elements:** the four component fixes from the v0.29 review ([4b9bdce](https://github.com/lelandcrangel/pitchfork-ui/commit/4b9bdceea94284a98403f4ce6be43ef1ad1aab35))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/core bumped from ^0.2.0 to ^0.3.0
    * @pitchfork-ui/tokens bumped from ^0.5.0 to ^0.6.0

## [0.2.1](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-v0.2.0...elements-v0.2.1) (2026-10-13)


### Bug Fixes

* **elements:** a form control with no visible label had no name at all ([74f6f6e](https://github.com/lelandcrangel/pitchfork-ui/commit/74f6f6e96f7ffd11b991f235de957e86d941c679))
* **elements:** keep focus inside an open pf-modal, not just put it there ([adcfc00](https://github.com/lelandcrangel/pitchfork-ui/commit/adcfc00caab216bb1d785b2842c1a7a8c5a1a5af))
* **elements:** pf-modal left focus outside the dialog on a raced open ([51f0a66](https://github.com/lelandcrangel/pitchfork-ui/commit/51f0a663244ab5f5ee972a685554e806c3ac6490))
* **elements:** tell a navigation when an item's `current` changes ([fa3d796](https://github.com/lelandcrangel/pitchfork-ui/commit/fa3d79657d2088a6cdfb6a70e123c470e3185914))

## [0.2.0](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-v0.1.0...elements-v0.2.0) (2026-10-11)


### Features

* **elements:** add 108 custom elements with React, Angular and Vue bindings ([#114](https://github.com/lelandcrangel/pitchfork-ui/issues/114)) ([50ed57a](https://github.com/lelandcrangel/pitchfork-ui/commit/50ed57ab3d9cdbda02258475be07c87c81ff5e43))


### Bug Fixes

* **elements:** pre-optimize the Stencil client dep for browser tests ([faca000](https://github.com/lelandcrangel/pitchfork-ui/commit/faca000990698bf88944f38784d40e6cf7f68aae))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/core bumped from ^0.1.0 to ^0.2.0
    * @pitchfork-ui/tokens bumped from ^0.4.1 to ^0.5.0
