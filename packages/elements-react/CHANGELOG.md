# Changelog

## [0.3.1](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-react-v0.3.0...elements-react-v0.3.1) (2026-11-22)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/elements bumped from ^0.4.0 to ^0.4.1

## [0.3.0](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-react-v0.2.2...elements-react-v0.3.0) (2026-11-19)


### ⚠ BREAKING CHANGES

* **elements-react:** PfTabs, PfAccordion, PfTreeView, PfButtonGroup, PfCalendar, PfCarousel and PfResizable no longer take onPfChange. Use onPfTabChange, onPfExpandedChange, onPfSelectionChange, onPfSlideChange or onPfResize; the event detail is unchanged. TypeScript reports each old prop as an error.

### Bug Fixes

* **elements-react:** stop installing ts-morph for consumers, and audit only what they install ([cea4316](https://github.com/lelandcrangel/pitchfork-ui/commit/cea43166f04c711ff3c2f59ad1590c8a67a8a143))


### Documentation

* **elements-react:** document the renamed event props for 0.3 ([0b4b641](https://github.com/lelandcrangel/pitchfork-ui/commit/0b4b641834216c5e157735c945f5a465b264de23))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/elements bumped from ^0.3.0 to ^0.4.0

## [0.2.2](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-react-v0.2.1...elements-react-v0.2.2) (2026-11-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/elements bumped from ^0.2.1 to ^0.3.0

## [0.2.1](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-react-v0.2.0...elements-react-v0.2.1) (2026-10-13)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/elements bumped from ^0.2.0 to ^0.2.1

## [0.2.0](https://github.com/lelandcrangel/pitchfork-ui/compare/elements-react-v0.1.0...elements-react-v0.2.0) (2026-10-11)


### Features

* **elements:** add 108 custom elements with React, Angular and Vue bindings ([#114](https://github.com/lelandcrangel/pitchfork-ui/issues/114)) ([50ed57a](https://github.com/lelandcrangel/pitchfork-ui/commit/50ed57ab3d9cdbda02258475be07c87c81ff5e43))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @pitchfork-ui/elements bumped from ^0.1.0 to ^0.2.0
