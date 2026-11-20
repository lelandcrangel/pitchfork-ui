# Changelog

## [0.4.1](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-v0.4.0...elements-v0.4.1) (2026-11-20)


### Bug Fixes

* **elements:** let text fields shrink to the column they are given ([0a268c0](https://github.com/lelandcrangel/pitchfork-ui/commit/0a268c0f599ae1d4778a13bd2d39bdddb3327ac2))

## [0.4.0](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-v0.3.0...elements-v0.4.0) (2026-11-19)


### ⚠ BREAKING CHANGES

* **elements:** importing an element module from @pitchfork-ui/elements/components no longer registers the element. Call the defineCustomElement() it exports, or use the loader's defineCustomElements(). The React, Angular and Vue bindings, the loader and the documented install paths are unaffected.
* **elements:** pf-tabs, pf-accordion, pf-tree-view, pf-button-group, pf-calendar, pf-carousel and pf-resizable no longer emit pfChange. Listen for pfTabChange, pfExpandedChange, pfSelectionChange, pfSlideChange or pfResize instead; the detail is unchanged. pfOpenChange, pfSelect, pfDismiss, pfSortChange, pfPageChange, pfCopy, pfCopyError, pfReject, pfToastDismiss and pfExpandedChange no longer bubble. A listener on the element itself, which is what every framework binding attaches, is unaffected; a listener delegated from an ancestor has to move onto the element.

### Features

* **elements:** add a link, a checkbox group and a description list, and extend four elements ([623512e](https://github.com/lelandcrangel/pitchfork-ui/commit/623512e100ac0d122983b3e663ba1d4ffa707fd5))
* **elements:** ship a Tailwind compatibility sheet as @pitchfork-ui/elements/tailwind.css ([c6ec8c9](https://github.com/lelandcrangel/pitchfork-ui/commit/c6ec8c9f0fc14d5ba2b17779b7865ff602f22640))
* **elements:** stop element events reaching listeners that are not theirs ([851f036](https://github.com/lelandcrangel/pitchfork-ui/commit/851f036f822499bc7c3622c359379d650fe83dfb))


### Bug Fixes

* **elements:** the forms and accessibility defects from the November audit ([1a30842](https://github.com/lelandcrangel/pitchfork-ui/commit/1a3084281a11ef472ef8669e59380be4246625cc))


### Performance Improvements

* **elements:** build picker panels on first open, and make each date formatter once ([5277459](https://github.com/lelandcrangel/pitchfork-ui/commit/5277459d820d6fb49c4a779ef0e836cddef5d644))
* **elements:** fetch the elements a lazy entry renders alongside it ([f4540f7](https://github.com/lelandcrangel/pitchfork-ui/commit/f4540f759937769c24a582eeed3abd4d4473adcd))
* **elements:** read the rich-text document once per keystroke ([6a64daf](https://github.com/lelandcrangel/pitchfork-ui/commit/6a64daf5b92ba5003b6859479966b28fa3422a64))
* **elements:** render the line, bar and radar charts once as they load ([089a532](https://github.com/lelandcrangel/pitchfork-ui/commit/089a532200eb3cf80e996ab7d8e5dbb5db61454a))
* **elements:** rescan a loading tree view once per frame, not once per item ([cf2f7c9](https://github.com/lelandcrangel/pitchfork-ui/commit/cf2f7c90e49d7db594187943c0996f583733a1b4))
* **elements:** ship only the elements an app uses, without the token sheet in each ([76781a4](https://github.com/lelandcrangel/pitchfork-ui/commit/76781a4da055676a4b82374fc17fd7714616310b))
* **elements:** stop carousel autoplay while hidden or scrolled out of view ([ca9f206](https://github.com/lelandcrangel/pitchfork-ui/commit/ca9f20656565aefc3dd57ed3063df8d0de069613))
* **elements:** stop each closed combobox forcing a layout while it loads ([bc8f0d4](https://github.com/lelandcrangel/pitchfork-ui/commit/bc8f0d47460700841308d7495fd32bc5c2aa40e0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/core bumped from ^0.3.0 to ^0.4.0
    * @pitchfork-ui/tokens bumped from ^0.6.0 to ^0.7.0

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
