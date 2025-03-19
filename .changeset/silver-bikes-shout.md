---
'@calamari-radix/gateway-ez-mode': minor
---

Improved structure:

- removed some unnecessary abstraction layers and introduced a familiar design which the regular gateway SDK also uses, with different services which are responsible for different uses.

Improved error handling:

- Added and exported some custom errors which are thrown by the services, so that the user can catch them and handle them as they see fit. Documentation has been added to the methods of each service to explain what errors can be thrown and why.

New features:

- Easily getting the current state version of the Radix network
- Easily getting the current epoch of the Radix network
- Easily getting XRD domains owned by a component (or account)
