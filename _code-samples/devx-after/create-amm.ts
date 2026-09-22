import { pathToFileURL } from 'node:url'
// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { AccountSetAsfFlags, WalletClient, Wallet, dropsToXrp, xrpToDrops } from 'xrpl'
import type { Amount } from 'xrpl'

function describeAmount(amount: Amount): string {
  return typeof amount === 'string'
    ? `${dropsToXrp(amount)} XRP`
    : `${amount.value} ${amount.currency}.${amount.issuer}`
}

export async function run(issuer: WalletClient, provider: WalletClient): Promise<void> {
  const asset = { currency: 'FOO', issuer: issuer.wallet.address }

  // Enable rippling before issuing tokens that can trade in the pool.
  await issuer.tx.accountSet({
    SetFlag: AccountSetAsfFlags.asfDefaultRipple
  }).signAndSubmit()

  // Give the provider a trust line, then issue enough FOO for the deposit.
  await provider.tx.trustSet({
    LimitAmount: { ...asset, value: '1000' }
  }).signAndSubmit()
  await issuer.tx.payment({
    Destination: provider.wallet.address,
    Amount: { ...asset, value: '1000' }
  }).signAndSubmit()

  // AMMCreate burns the current owner reserve, rather than the ordinary fee.
  const server = await provider.command.serverState()
  const ledger = server.result.state.validated_ledger
  if (ledger == null) throw new Error('Server has no validated ledger yet')

  // Create a fresh FOO/XRP pool. Both Amount forms are visible in one object.
  const created = await provider.tx.ammCreate({
    Amount: { ...asset, value: '100' },
    Amount2: xrpToDrops('10'),
    TradingFee: 500, // 0.5%; units are 1/100,000.
    Fee: String(ledger.reserve_inc)
  }).signAndSubmit()
  console.log(`AMM created: https://devnet.xrpl.org/transactions/${created.result.hash}`)

  // Query the AMM: the named command infers its response shape.
  const response = await provider.command.ammInfo({
    asset,
    asset2: { currency: 'XRP' },
    ledger_index: 'validated'
  })
  const amm = response.result.amm
  console.log(`Pool: ${describeAmount(amm.amount)} / ${describeAmount(amm.amount2)}`)
  console.log(`LP tokens: ${amm.lp_token.value} ${amm.lp_token.currency}`)

  // Inspect the provider's LP-token trust line.
  const balances = await provider.command.accountLines({
    account: provider.wallet.address,
    peer: amm.lp_token.issuer,
    ledger_index: 'validated'
  })
  console.log('LP-token trust lines:', balances.result.lines)
}
async function main(): Promise<void> {
  const server = process.env.XRPL_SERVER ?? 'wss://s.devnet.rippletest.net:51233'
  const issuer = new WalletClient(server, { wallet: Wallet.generate() })
  const provider = new WalletClient(server, { wallet: Wallet.generate() })
  try {
    await issuer.connect()
    await provider.connect()
    await issuer.fundWallet(issuer.wallet)
    await provider.fundWallet(provider.wallet)
    await run(issuer, provider)
  } finally {
    await Promise.all([issuer.disconnect(), provider.disconnect()])
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
