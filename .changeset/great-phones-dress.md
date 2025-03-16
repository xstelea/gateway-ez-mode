---
'@calamari-radix/gateway-ez-mode': minor
---

Updated metadata extraction by introducing a more generic metadata extraction framework with nice type inference, and refactor some of the resource info fetching functions to use this new method.
Updated ResourceInfo interface to include functions to fetch metadata, which enables users to fetch custom metadata other than the default ones provided in the metadata standard, which were already included in that object.
