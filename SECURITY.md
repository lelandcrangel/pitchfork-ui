# Security Policy

## Supported versions

Security fixes are applied to the latest published `0.x` release of
`@pitchfork-ui/react`. Please make sure you are on the most recent version before
reporting an issue.

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Instead, report it privately using GitHub's
[private vulnerability reporting](https://github.com/lelandcrangel/pitchfork-ui/security/advisories/new),
or email the maintainer at the address listed on the npm package page.

When reporting, please include:

- A description of the vulnerability and its impact
- Steps to reproduce (a minimal example is ideal)
- The affected version(s)

You can expect an initial acknowledgement within a few days. Once the issue is
confirmed, a fix will be released as promptly as possible and the advisory will
credit the reporter unless anonymity is requested.

## Scope

This is a front-end component library with no server component. The most relevant
classes of issue are:

- Cross-site scripting (XSS) via unsanitised props rendered to the DOM
- Prototype pollution in utility helpers
- Supply-chain issues in published artifacts

Thank you for helping keep Pitchfork UI and its users safe.
