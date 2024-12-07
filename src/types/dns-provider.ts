import { DnsRecord, DnsRecordDto } from './dns-record.ts'

export interface DnsProvider {
  readonly id: string
  readonly name: string
  addRecords: (domain: string, records: DnsRecord[]) => Promise<void>
  removeRecords: (domain: string, recordIds: string[]) => Promise<void>
  getRecords: (domain: string) => Promise<DnsRecordDto[]>
}

export interface DnsProviderConstructor {
  new (env: Record<string, string>): DnsProvider
}

export function createDnsProvider(
  constructor: DnsProviderConstructor,
  env: Record<string, string>,
): DnsProvider {
  return new constructor(env)
}
