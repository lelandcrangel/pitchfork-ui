# Changelog

## [0.3.0](https://github.com/lelandcrangel/pitchfork-ui/compare/core-v0.2.0...core-v0.3.0) (2026-11-09)


### ⚠ BREAKING CHANGES

* **core:** IconGlyph is now the general glyph shape rather than Font Awesome's tuple, and resolveIconGlyph returns it, including for roles and built-in glyphs. The FA tuple type is FontAwesomeIconDefinition, which getIconPaths now takes. severityIconName returns a role (info, success, warning, danger), and the components' internal <pf-icon> elements carry role names, so code reading those names sees `close` where it saw `circle-xmark`. Registering a Font Awesome definition with registerIconGlyphs works as before.

### Features

* **core:** make the icon set swappable for any library ([cf2653b](https://github.com/lelandcrangel/pitchfork-ui/commit/cf2653b403227f4fe6a0952d276db900ca68069c))


### Bug Fixes

* **core:** store a registered icon under the name a lookup asks for ([61c335e](https://github.com/lelandcrangel/pitchfork-ui/commit/61c335e9ede85b3f06b7b8b1cd4adc196c4adca9))

## [0.2.0](https://github.com/lelandcrangel/pitchfork-ui/compare/core-v0.1.0...core-v0.2.0) (2026-10-11)


### Features

* **elements:** add 108 custom elements with React, Angular and Vue bindings ([#114](https://github.com/lelandcrangel/pitchfork-ui/issues/114)) ([50ed57a](https://github.com/lelandcrangel/pitchfork-ui/commit/50ed57ab3d9cdbda02258475be07c87c81ff5e43))
