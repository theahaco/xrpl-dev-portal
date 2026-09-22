# Issue an MPT with metadata in TypeScript

This strict TypeScript example targets published `xrpl` **5.3.0**. It creates a fresh issuer on Devnet, issues a demonstration MPT, reads its metadata, updates its mutable properties, then makes its metadata immutable. Devnet must have the relevant MPT amendments enabled; a server rejection is reported as a failure, not as successful issuance.

```sh
npm install
npm run typecheck
npm start
```

Use Node.js 22 or later. The sample funds a disposable account with the Devnet faucet. No private credentials are required. Each run creates a new token. Metadata immutability is permanent for that token.

Hover over the object fields after `satisfies MPTokenMetadata`, `satisfies MPTokenIssuanceCreate`, and `satisfies MPTokenIssuanceSet` for completion and inline documentation. The script uses named flag properties where the SDK accepts them.

Runtime checks are deliberate: successful validation does not guarantee transaction success, the creation ID is optional in the current SDK, and ledger entry selectors currently return a union. The sample uses no `any`, assertions, or application-side transaction helper to suppress these gaps. Disconnect runs even if a request fails.

For the separately labeled **unreleased SDK prototype** comparison, see [DevX after examples](../../devx-after/README.md). The example in this directory continues to use published xrpl 5.3.0.
