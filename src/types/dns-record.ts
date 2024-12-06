export interface DnsRecord {
  name: string
  type: DnsRecordType
  value: string
  line: string
  group?: string
  comment?: string
  weight?: number
  ttl?: number
}

export interface DnsRecordDto extends DnsRecord {
  id: string
}

export type DnsRecordType = 'A' | 'AAAA' | 'TXT' | string
