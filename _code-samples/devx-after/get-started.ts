// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { pathToFileURL } from 'node:url'
// @chunk {"steps": ["import-node-tag"]}
import { WalletClient, Wallet, xrpToDrops } from 'xrpl'
// @chunk-end

const log = console.log

export async function run(
  client: WalletClient,
  destination: Wallet,
  listenMilliseconds = 10_000
): Promise<void> {
  // @chunk {"steps": ["query-xrpl-tag"]}
  const response = await client.command.accountInfo({
    account: client.wallet.address,
    ledger_index: 'validated'
  })
  log(`Account sequence: ${response.result.account_data.Sequence}`)
  // @chunk-end

  // @chunk {"steps": ["build-tx-tag"]}
  const submitted = await client.tx.payment({
    Amount: xrpToDrops('1'),
    Destination: destination.address
  }).signAndSubmit()

  log(`Payment confirmed: ${submitted.result.hash}`)
  // @chunk-end

  // @chunk {"steps": ["listen-for-events-tag"]}
  client.on('ledgerClosed', (ledger) => {
    log(`Ledger #${ledger.ledger_index}: ${ledger.txn_count} transactions`)
  })
  await client.command.subscribe({ streams: ['ledger'] })
  await new Promise<void>((resolve) => setTimeout(resolve, listenMilliseconds))
  // @chunk-end
}

// The command-line entrypoint owns the connection; run() accepts a wallet-bound client and a funded destination.
async function main(): Promise<void> {
  // @chunk {"steps": ["connect-tag"]}
  const client = new WalletClient(
    process.env.XRPL_SERVER ?? 'wss://s.altnet.rippletest.net:51233/',
    { wallet: Wallet.generate() }
  )
  try {
    await client.connect()
    log('Connected to Testnet')
    // @chunk-end
    // @chunk {"steps": ["get-account-create-wallet-tag"]}
    await client.fundWallet(client.wallet)
    const { wallet: destination } = await client.fundWallet()
    // @chunk-end
    await run(client, destination)
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
