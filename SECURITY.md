# Security policy

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/ohad6k/VibeRaven/security/advisories/new) if it is available. If the form is unavailable, open an [issue](https://github.com/ohad6k/VibeRaven/issues/new) titled "Request for a private security contact" with no vulnerability details. Wait for a maintainer to arrange a private channel before sharing a reproduction.

Include the affected package and version, Node/browser and OS versions, a minimal synthetic reproduction, expected behavior and observed impact. Redact credentials, customer data and private repository paths. Do not post exploit details or sensitive artifacts publicly. If a credential was exposed, revoke or rotate it at its provider.

## Scope and support

Reports are welcome for the CLI, command package, MCP server, sessions engine, agent instructions and distributed artifacts. This repository contains curated public material; npm packages contain the executables. Please reproduce on the current release when possible and name the exact version. There is no guaranteed response time or long-term support policy.

`check` reads repository evidence and does not certify live provider state. `race` executes trusted repository SQL in an offline engine; it is not a security sandbox. A passing bounded test is not a security audit. Local MCP tools can edit repository files when invoked; review tool arguments and previews. Hosted guides are a separate service.
