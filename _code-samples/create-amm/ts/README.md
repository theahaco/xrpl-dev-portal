# Create an AMM with TypeScript

The guided sample targets published `xrpl` **5.3.0** with strict type checking. It funds independent issuer and liquidity-provider wallets on Devnet, enables rippling, creates a trust line, issues FOO, creates a FOO/XRP pool, and queries its reserves and LP tokens. No existing market liquidity or external token issuer is assumed.

Use Node.js 22 or later:

```sh
npm install
npm run typecheck
npm start
```

Each submitted transaction is checked independently for `tesSUCCESS`; errors stop later steps, and the connection closes in `finally`. AMM creation consumes the network's current owner reserve as its transaction fee, fetched from `server_state`. The sample uses only faucet-funded Devnet accounts.

`create-amm-guided.ts` demonstrates both XRP (a drops string) and an issued token (currency, issuer, value) without nullable custom asset types or `any`. Request and transaction fields use public SDK types; response types are inferred.

The pre-existing `create-amm.ts` and `lib/amm.ts` are retained as an advanced historical example covering deposit, withdrawal, bids, votes, and swaps. They have not been brought to the same standard and are excluded from the guided typecheck. `npm run create-amm-legacy` preserves the old entrypoint for comparison; it is not the recommended starting point.

For the separately labeled **unreleased SDK prototype** comparison, see [DevX after examples](../../devx-after/README.md). The example in this directory continues to use published xrpl 5.3.0.
