// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { pathToFileURL } from 'node:url'
import { WalletClient, Wallet, xrpToDrops } from 'xrpl'

export async function run(client: WalletClient, receiver: Wallet): Promise<void> {
  // Build a payment. The client supplies its account and signing wallet.
  const payment = client.tx.payment({
    Destination: receiver.address,
    Amount: xrpToDrops('1')
  })

  // Prepare, sign locally and wait for successful validation.
  const confirmed = await payment.signAndSubmit()
  console.log(`Payment confirmed: ${confirmed.result.hash}`)
  console.log(`Confirmed destination: ${confirmed.result.tx_json.Destination}`)
  console.log(`Receiver balance: ${await client.getXrpBalance(receiver.address)} XRP`)
}

// The command-line entrypoint owns the connection and test-account funding.
async function main(): Promise<void> {
  const client = new WalletClient(
    process.env.XRPL_SERVER ?? 'wss://s.altnet.rippletest.net:51233',
    { wallet: Wallet.generate() }
  )
  try {
    await client.connect()
    await client.fundWallet(client.wallet)
    const { wallet: receiver } = await client.fundWallet()
    await run(client, receiver)
  } finally {
    await client.disconnect()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
