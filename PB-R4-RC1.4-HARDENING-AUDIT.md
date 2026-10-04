# PB Audit — R4 RC1.4

Critical finding from RC1.3: service-worker cache key still identified R3B RC2 and static JS/JSON used stale-while-revalidate. Repeated patch deployments could therefore mix old and new code. RC1.4 moves code/data to network-first and keeps stale caching only for heavy media.

Authoring v1.1 is intentionally structured around registries/policies/tokens rather than adding more one-off editor code. Server persistence remains adapter-based until the production database schema for lesson versions is formally locked.
