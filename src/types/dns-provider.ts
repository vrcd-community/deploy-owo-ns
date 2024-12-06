import { DnsRecord, DnsRecordDto } from './dns-record.ts'

export interface DnsProvider {
  readonly id: string
  readonly name: string
  addRecords: (domain: string, records: DnsRecord[]) => Promise<void>
  removeRecords: (domain: string, recordIds: string[]) => Promise<void>
  getRecords: (domain: string) => Promise<DnsRecordDto[]>
}
