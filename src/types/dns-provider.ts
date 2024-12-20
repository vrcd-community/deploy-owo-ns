import { DomainDeploySchema } from './config.ts'
import { DnsRecord, DnsRecordDto, DnsRecordType } from './dns-record.ts'

export interface DnsProvider {
  readonly id: string
  readonly name: string
  addRecords: (domain: string, records: DnsRecord[]) => Promise<void>
  removeRecords: (domain: string, recordIds: string[]) => Promise<void>
  getRecords: (
    domain: string,
    type?: DnsRecordType,
    line?: string,
    name?: string,
  ) => Promise<DnsRecordDto[]>
}

export interface DnsProviderConstructor {
  new (env: Record<string, string>, config: DomainDeploySchema): DnsProvider
}

export function createDnsProvider(
  constructor: DnsProviderConstructor,
  env: Record<string, string>,
  config: DomainDeploySchema,
): DnsProvider {
  return new constructor(env, config)
}
