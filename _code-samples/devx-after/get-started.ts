// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { pathToFileURL } from 'node:url'
// @chunk {"steps": ["import-node-tag"]}
// Runtime functions and type-only imports appear separately in the editor.
import { Client, Wallet, xrpToDrops, validate } from 'xrpl'
import type { AccountInfoRequest, Payment } from 'xrpl'
// @chunk-end

const log = console.log

export async function run(
  client: Client,
  testWallet: Wallet,
  destination: Wallet,
  listenMilliseconds = 10_000
): Promise<void> {
  // @chunk {"steps": ["query-xrpl-tag"]}
  // `satisfies` checks fields while preserving command: 'account_info'.
  const request = {
    command: 'account_info',
    account: testWallet.address,
    ledger_index: 'validated'
  } satisfies AccountInfoRequest
  // No response annotation: the command selects AccountInfoResponse for you.
  const response = await client.request(request)
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  // Use our own funded destination rather than an external example address.
  const payment = {
    TransactionType: 'Payment',
    Account: testWallet.address,
    Amount: xrpToDrops('1'),
    Destination: destination.address
  } satisfies Payment

  // Checks supported local constraints; ledger state still determines success.
  // `satisfies` keeps the object compatible with validate(), without a cast.
  validate(payment)
  const submitted = await client.submitAndWait(payment, { wallet: testWallet })
  // A validated transaction can still fail. Check its result before continuing.
  // The SDK guarantees parsed metadata after validated inclusion.
  const metadata = submitted.result.meta
  if (metadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Payment failed: ${metadata.TransactionResult}`)
  }
  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
  // Register before subscribing; await the subscription so errors propagate.
  client.on('ledgerClosed', (ledger) => {
    log(`Ledger #${ledger.ledger_index}: ${ledger.txn_count} transactions`)
  })
  await client.request({ command: 'subscribe', streams: ['ledger'] })
  await new Promise<void>((resolve) => setTimeout(resolve, listenMilliseconds))
  // @chunk-end
}

// The command-line entrypoint owns the connection; run() accepts funded wallets.
async function main(): Promise<void> {
  const client = new Client(process.env.XRPL_SERVER ?? 'wss://s.altnet.rippletest.net:51233/')
  try {
    // @chunk {"steps": ["connect-tag"]}
    await client.connect()
    log('Connected to Testnet')
    // @chunk-end
    // @chunk {"steps": ["get-account-create-wallet-tag"]}
    // The wallet type is inferred: type testWallet. to explore its fields.
    const { wallet: testWallet } = await client.fundWallet()
    // @chunk-end
    // @chunk {"steps": ["get-account-create-wallet-b-tag"]}
    // const testWallet = Wallet.generate()
    // @chunk-end
    // @chunk {"steps": ["get-account-create-wallet-c-tag"]}
    // const testWallet = Wallet.fromSeed('your-seed-key')
    // @chunk-end
    const { wallet: destination } = await client.fundWallet()
    await run(client, testWallet, destination)
  } finally {
    // @chunk {"steps": ["disconnect-node-tag"]}
    // Always release the connection, including when a request fails.
    await client.disconnect()
    // @chunk-end
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
