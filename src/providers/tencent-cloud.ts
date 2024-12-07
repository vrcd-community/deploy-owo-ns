import { DnsProvider } from '../types/dns-provider.ts'
import { DnsRecord, DnsRecordDto } from '../types/dns-record.ts'

import { dnspod } from 'tencentcloud-sdk-nodejs-dnspod'

import {
  AddRecordBatch,
  RecordListItem,
} from 'tencentcloud-sdk-nodejs-dnspod/tencentcloud/services/dnspod/v20210323/dnspod_models.d.ts'

export default class TencentCloudDnsProvider implements DnsProvider {
  readonly id: string = 'tencent-cloud'
  readonly name: string = 'Tencent Cloud (DnsPod)'

  private readonly client

  constructor(env: Record<string, string>) {
    this.client = new dnspod.v20210323.Client({
      credential: {
        secretId: env['TENCENT_CLOUD_SECRET_ID'] ?? '',
        secretKey: env['TENCENT_CLOUD_SECRET_KEY'] ?? '',
      },
    })
  }

  async addRecords(domain: string, records: DnsRecord[]): Promise<void> {
    const domainInfo = await this.client.DescribeDomain({
      Domain: domain,
    })

    const domainId = domainInfo.DomainInfo?.DomainId

    if (!domainId) {
      throw new Error('DomainId not found')
    }

    await this.client.CreateRecordBatch({
      DomainIdList: [domainId.toString()],
      RecordList: records.map((record) => ({
        SubDomain: record.name,
        RecordType: record.type,
        Value: record.value,
        RecordLine: record.line,
        TTL: record.ttl,
        Weight: record.weight,
      } as AddRecordBatch)),
    })
  }

  async removeRecords(_domain: string, recordIds: string[]): Promise<void> {
    await this.client.DeleteRecordBatch({
      RecordIdList: recordIds.map((id) => parseInt(id)),
    })
  }

  async getRecords(domain: string): Promise<DnsRecordDto[]> {
    const limit = 3000
    let records: DnsRecordDto[] = []

    const initialResponse = await this.client.DescribeRecordList({
      Domain: domain,
      Limit: limit,
      Offset: 0,
    })

    records = records.concat(
      initialResponse.RecordList?.map((record) => this.toDnsRecord(record)) ||
        [],
    )

    const pageToFetch = Math.ceil(
      (initialResponse.RecordCountInfo?.TotalCount ?? 0) / limit,
    )

    for (let index = 1; index < pageToFetch; index++) {
      const response = await this.client.DescribeRecordList({
        Domain: domain,
        Limit: limit,
        Offset: index * limit,
      })

      records = records.concat(
        response.RecordList?.map((record) => this.toDnsRecord(record)) || [],
      )
    }

    return records
  }

  private toDnsRecord(record: RecordListItem): DnsRecordDto {
    return {
      id: record.RecordId.toString(),
      name: record.Name,
      type: record.Type,
      value: record.Value,
      line: record.Line,
      ttl: record.TTL,
      weight: record.Weight,
    }
  }
}
