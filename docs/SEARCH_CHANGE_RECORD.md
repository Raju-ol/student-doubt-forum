# Indexed word search

9 November 2026. Recommendations section 3.2. Doubt has a weighted text index: title 10, tags 5, body 1. Nonempty search uses MongoDB $text and textScore ordering, with creation time/id tie-breaks; unsearched lists retain date ordering. Existing filters and bounded pagination remain combined with search.

Behavior change: words and English stemmed forms match, partial word substrings no longer necessarily do. For example normalize/normalizing match; normali does not. MongoDB text-search grammar applies (quoted phrases and excluded terms), so this is not substring search or semantic/AI search. English stop words may return no results. Tags are now searchable too.

No existing body/text is rewritten. The text index builds during existing model initialization after deployment. We do not drop a previous incompatible text index automatically: if a deployment already has one, inspect index definitions before scheduling any explicit migration. Live build time and multilingual relevance have not been measured. Text indexing remains English; multilingual Atlas Search is future work.

Integration tests cover stemming, partial-word nonmatch, tag search, existing subject/semester/tag combination, punctuation and pagination. Exact final suite/build results are in TESTING.md. No production index migration is run from the laptop.
