---
seo:
    description: Send your first test XRP and explore the ledger with TypeScript.
top_nav_name: TypeScript
top_nav_grouping: Get Started
labels:
  - Development
showcase_icon: assets/img/logos/typescript.svg
---

{% code-walkthrough
  filesets=[
    {
      "files": ["/_code-samples/get-started/ts/get-acct-info.ts"],
      "downloadAssociatedFiles": ["/_code-samples/get-started/ts/package.json", "/_code-samples/get-started/ts/tsconfig.json", "/_code-samples/get-started/ts/get-acct-info.ts", "/_code-samples/get-started/ts/README.md"],
      "when": { "environment": "Node" }
    },
    {
      "files": ["/_code-samples/get-started/ts/browser.ts"],
      "downloadAssociatedFiles": ["/_code-samples/get-started/ts/index.html", "/_code-samples/get-started/ts/xrpl-browser.js", "/_code-samples/get-started/ts/browser.ts", "/_code-samples/get-started/ts/package.json", "/_code-samples/get-started/ts/tsconfig.json", "/_code-samples/get-started/ts/README.md"],
      "when": { "environment": "Web" }
    }
  ]
  filters={
    "environment": {
      "label": "Environment",
      "items": [
        { "value": "Node" },
        { "value": "Web" },
      ]
    }
  }
%}

# Send Your First Test XRP with TypeScript

Create two test wallets, send a payment, and watch the ledger confirm it. Along the way, your editor will guide the fields you can send and the data you get back.

{% admonition type="info" name="aha SDK preview" %}
This walkthrough demonstrates the proposed SDK experience on aha's `aha/devx-audit-2026-09` branches. It uses the unreleased local SDK build. The [published 5.3.0 comparison](https://github.com/theahaco/xrpl-dev-portal/tree/aha/devx-audit-2026-09/_code-samples/devx-before/get-started) is available separately.
{% /admonition %}

## Before You Start

You need Node.js 22 or later and basic TypeScript familiarity. Select **Node** or **Web** above. Both examples use Testnet and create fresh wallets; test XRP has no monetary value.

For this preview, check out the `aha/devx-audit-2026-09` branch in [xrpl.js](https://github.com/theahaco/xrpl.js/tree/aha/devx-audit-2026-09) and [xrpl-dev-portal](https://github.com/theahaco/xrpl-dev-portal/tree/aha/devx-audit-2026-09) as sibling directories. Build the SDK using its repository setup instructions, including its workspace dependencies, then work in `xrpl-dev-portal/_code-samples/get-started/ts`.

The source panel follows each step. Click **Download** to save the example files.

## Try It

<!-- Web steps -->
{% step id="import-web-tag" when={ "environment": "Web" } %}
### 1. Install Dependencies

Install the example dependencies, then import the SDK functions shown in the source panel:

```sh
npm install
```

The included HTML loads your local prototype browser bundle and runs the compiled TypeScript. Its import map uses the same SDK build as the compiler.

{% code-snippet file="/_code-samples/get-started/ts/index.html" language="html" /%}
{% /step %}

<!-- Node.js steps -->
{% step id="import-node-tag" when={ "environment": "Node" } %}
### 1. Install Dependencies

Install the example's SDK dependency and TypeScript compiler:

```sh
npm install
```

Import `WalletClient`, `Wallet`, and `xrpToDrops` as shown in the source panel. The supplied package points to the sibling SDK checkout for this preview.
{% /step %}

{% step id="configure-ts-tag" %}
### 2. Configure TypeScript

Add a `tsconfig.json` file to tell the compiler how to build your project. The settings below target modern JavaScript, enable `strict` type checking, and write the compiled output to a `dist` folder.

{% code-snippet file="/_code-samples/get-started/ts/tsconfig.json" language="json" /%}
{% /step %}

{% step id="connect-tag" %}
### 3. Connect to Testnet

Create a `WalletClient` with `Wallet.generate()` as its signing wallet, then call `connect()`. The client now knows which account will send your transactions. The example closes the connection in `finally`, including when an operation fails.
{% /step %}

{% step id="get-account-create-wallet-tag" %}
### 4. Create Two Test Wallets

`fundWallet(client.wallet)` funds your signing wallet with test XRP. Call `fundWallet()` again to create and fund a recipient. Type `client.wallet.` in your editor to explore your wallet's address and methods.
{% /step %}

{% step id="query-xrpl-tag" %}
### 5. Query the XRP Ledger

Type `client.command.` to discover available requests, then choose `accountInfo`. Your editor guides the request fields and infers the response.

Try typing `response.result.account_data.` to explore the account fields. This example prints the account sequence.
{% /step %}

{% step id="build-tx-tag" %}
### 6. Send 1 Test XRP

Type `client.tx.` to discover the available transactions, then choose `payment`. Your editor offers Payment fields such as `Amount` and `Destination`. The client supplies the transaction type and your wallet's account. [`xrpToDrops()`](https://js.xrpl.org/functions/xrpToDrops.html) converts 1 XRP into the unit the ledger expects.

Call `.signAndSubmit()` to fill the fee and sequence, sign with your wallet, send the payment, and wait for confirmed success. If the transaction fails, the SDK throws an error that the example's error handler reports. Print the payment hash when the call returns.

Creating a draft sends nothing. You can inspect it with `.toJSON()` before submitting. For applications that prefer handling an explicit outcome, `.trySignAndSubmit()` returns `{ ok: true, response }` or `{ ok: false, error }`. The lower-level `submitAndWait()` and `trySubmitAndWait()` follow the same success/error contract.

{% /step %}

{% step id="listen-for-events-tag" %}
### 7. Listen for Events

Listen for `ledgerClosed`, then subscribe to the ledger stream. The callback's `ledger` value is typed automatically. Explore its fields in your editor while the example prints new ledger numbers for ten seconds.
{% /step %}

{% step id="disconnect-node-tag" when={ "environment": "Node" } %}
### 8. Disconnect

Call the [`disconnect()`](https://js.xrpl.org/classes/Client.html#disconnect) function so Node.js can end the process. The example listens for ten seconds on its successful path. A `finally` block disconnects even when a request or transaction fails.
{% /step %}

{% step id="disconnect-web-tag" when={ "environment": "Web" } %}
### 8. Disconnect

Call the [`disconnect()`](https://js.xrpl.org/classes/Client.html#disconnect) function to disconnect from the ledger when done. The example listens for ten seconds on its successful path. A `finally` block disconnects even when a request or transaction fails.
{% /step %}

{% step id="run-app-node-tag" when={ "environment": "Node" } %}
### 9. Compile and Run the Application

From the downloaded example directory:

```sh
npm install
npm run typecheck
npm start
```

The script prints an account sequence, a confirmed transaction hash, and ledger events. A failure produces an error and a nonzero exit status. It requires a reachable Testnet server and faucet, and each run funds fresh accounts.
{% /step %}

{% step id="run-app-web-tag" when={ "environment": "Web" } %}
### 9. Compile and Run the Application

Compile, then serve the directory over HTTP so browser module imports work:

```sh
npm install
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. The page loads the same local SDK build used during compilation. Rebuild after changing the TypeScript files. The page displays account, payment, and ledger-event results, or the error that stopped the run.
{% /step %}

## See Also

- **Concepts:**
    - [XRP Ledger Overview](/about/)
    - [Client Libraries](../../references/client-libraries.md)
- **Tutorials:**
    - [Get Started Using JavaScript](get-started-javascript.md)
    - [Send XRP](../payments/send-xrp)
    - [Issue a Fungible Token](../tokens/fungible-tokens/issue-a-fungible-token.md)
    - [Set up Secure Signing](../../concepts/transactions/secure-signing.md)
- **References:**
    - [`xrpl.js` Reference](https://js.xrpl.org/)
    - [Public API Methods](../../references/http-websocket-apis/public-api-methods/index.md)
    - [API Conventions](../../references/http-websocket-apis/api-conventions/index.md)
        - [base58 Encodings](../../references/protocol/data-types/base58-encodings.md)
    - [Transaction Formats](../../references/protocol/transactions/index.md)

{% raw-partial file="/docs/_snippets/common-links.md" /%}

{% /code-walkthrough %}
