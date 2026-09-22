// PROTOTYPE: requires the built aha DevX SDK fork; not published xrpl 5.3.0.
import { pathToFileURL } from 'node:url'
import {
  Client,
  MPTokenIssuanceCreateImmutableFlags,
  MPTokenIssuanceSetFlags,
  encodeMPTokenMetadata,
  decodeMPTokenMetadata
} from 'xrpl'
import type { MPTokenIssuanceCreate, MPTokenIssuanceSet, MPTokenMetadata, Wallet } from 'xrpl'

export async function run(client: Client, issuer: Wallet): Promise<void> {
  console.log(`Issuer: ${issuer.address}`)

  // Define metadata as JSON
  // Type-ahead exposes documented metadata fields before encoding them to hex.
  const metadata = {
    ticker: 'TBILL',
    name: 'T-Bill Yield Token',
    desc: 'Demonstration token backed by fictional short-term Treasuries.',
    icon: 'https://example.org/tbill-icon.png',
    asset_class: 'rwa',
    asset_subclass: 'treasury',
    issuer_name: 'Example Yield Co.',
    uris: [{ uri: 'https://example.org/tbill', category: 'website', title: 'Product' }],
    additional_info: { interest_rate: '5.00%', maturity_date: '2045-06-30' }
  } satisfies MPTokenMetadata

  // Define the issuance transaction
  const issuance = {
    TransactionType: 'MPTokenIssuanceCreate',
    Account: issuer.address,
    AssetScale: 4,
    MaximumAmount: '50000000',
    TransferFee: 0,
    // Named properties give completion and avoid memorizing numeric flags.
    Flags: { tfMPTCanTransfer: true, tfMPTCanLock: true },
    ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTCanClawback,
    MPTokenMetadata: encodeMPTokenMetadata(metadata)
  } satisfies MPTokenIssuanceCreate

  // Submit and check the result
  const created = await client.submitAndWait(issuance, { wallet: issuer })
  const creationMetadata = created.result.meta
  if (creationMetadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Issuance failed: ${creationMetadata.TransactionResult}`)
  }
  // A typed object already infers issuance metadata; the ID remains optional.
  if (creationMetadata.mpt_issuance_id == null) {
    throw new Error('Successful issuance did not return an MPT issuance ID')
  }
  const issuanceId = creationMetadata.mpt_issuance_id
  console.log(`MPT created: https://devnet.xrpl.org/mpt/${issuanceId}`)

  // Query and decode metadata
  const entry = await client.request({
    command: 'ledger_entry',
    mpt_issuance: issuanceId,
    ledger_index: 'validated'
  })
  const node = entry.result.node
  // The MPT selector infers MPTokenIssuance; metadata is still optional.
  if (node.MPTokenMetadata == null) {
    throw new Error('Expected an MPT issuance with metadata')
  }
  console.log('Metadata:', decodeMPTokenMetadata(node.MPTokenMetadata))

  // Update mutable properties
  const updatedMetadata = {
    ...metadata,
    additional_info: { ...metadata.additional_info, interest_rate: '4.75%' }
  } satisfies MPTokenMetadata
  const update = {
    TransactionType: 'MPTokenIssuanceSet',
    Account: issuer.address,
    MPTokenIssuanceID: issuanceId,
    MPTokenMetadata: encodeMPTokenMetadata(updatedMetadata),
    TransferFee: 10,
    Flags: MPTokenIssuanceSetFlags.tfMPTSetCanTrade,
    // Replaces metadata first, then permanently prevents later metadata edits.
    ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTMetadata
  } satisfies MPTokenIssuanceSet
  const updated = await client.submitAndWait(update, { wallet: issuer })
  const updateMetadata = updated.result.meta
  if (updateMetadata.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Update failed: ${updateMetadata.TransactionResult}`)
  }

  // Confirm the update
  const confirmation = await client.request({
    command: 'ledger_entry',
    mpt_issuance: issuanceId,
    ledger_index: 'validated'
  })
  const updatedNode = confirmation.result.node
  if (updatedNode.MPTokenMetadata == null) {
    throw new Error('Expected an updated MPT issuance with metadata')
  }
  console.log('Transfer fee:', updatedNode.TransferFee)
  console.log('Updated metadata:', decodeMPTokenMetadata(updatedNode.MPTokenMetadata))
}

// The command-line entrypoint owns the connection; run() accepts funded wallets.
async function main(): Promise<void> {
  const client = new Client(process.env.XRPL_SERVER ?? 'wss://s.devnet.rippletest.net:51233')
  try {
    await client.connect()
    const { wallet: issuer } = await client.fundWallet()
    await run(client, issuer)
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
