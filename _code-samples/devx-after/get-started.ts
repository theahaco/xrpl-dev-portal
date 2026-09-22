// PROTOTYPE: same workflow as ../get-started/ts/get-acct-info.ts.
import { pathToFileURL } from 'node:url'
// @chunk {"steps": ["import-node-tag"]}
import { Client, Wallet, xrpToDrops } from 'xrpl'
// @chunk-end

const log = console.log

export async function run(
  client: Client,
  testWallet: Wallet,
  destination: Wallet,
  listenMilliseconds = 10_000
): Promise<void> {
  // @chunk {"steps": ["query-xrpl-tag"]}
  const response = await client.request({
    command: 'account_info',
    account: testWallet.address,
    ledger_index: 'validated'
  })
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  const submitted = await client.submitAndWait({
    TransactionType: 'Payment',
    Account: testWallet.address,
    Amount: xrpToDrops('1'),
    Destination: destination.address
  }, { wallet: testWallet })

  const result = submitted.result.meta.TransactionResult
  if (result !== 'tesSUCCESS') {
    throw new Error(`Payment failed: ${result}`)
  }
  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
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
    const { wallet: testWallet } = await client.fundWallet()
    const { wallet: destination } = await client.fundWallet()
    // @chunk-end
    await run(client, testWallet, destination)
  } finally {
    // @chunk {"steps": ["disconnect-node-tag"]}
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
