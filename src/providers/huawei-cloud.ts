import { DnsProvider } from '../types/dns-provider.ts'
import { DnsRecord, DnsRecordDto, DnsRecordType } from '../types/dns-record.ts'

import { BasicCredentials } from '@huaweicloud/huaweicloud-sdk-core'
import {
  BatchCreateRecordSetWithLine,
  CreateRecordSetWithBatchLinesRequest,
  CreateRSetBatchLinesReq,
  DeleteRecordSetsRequest,
  DnsClient,
  ListPublicZonesRequest,
  ShowRecordSetByZoneRequest,
  ShowRecordSetByZoneResp,
} from '@huaweicloud/huaweicloud-sdk-dns'

export default class HuaweiCloudDnsProvider implements DnsProvider {
  readonly id: string = 'tencent-cloud'
  readonly name: string = 'Tencent Cloud (DnsPod)'

  private readonly client: DnsClient

  private readonly ispMap: Record<string, string> = {
    '中国电信': 'Dianxin',
    '中国联通': 'Liantong',
    '中国移动': 'Yidong',
    '中国教育和科研计算机网': 'Jiaoyuwang',
  }

  constructor(env: Record<string, string>) {
    const credentials = new BasicCredentials()
      .withAk(env.HUAWEICLOUD_SDK_AK)
      .withSk(env.HUAWEICLOUD_SDK_SK)

    this.client = DnsClient.newBuilder()
      .withCredential(credentials)
      .withEndpoint(env.HUAWEICLOUD_SDK_ENDPOINT)
      .build()
  }

  async addRecords(domain: string, records: DnsRecord[]): Promise<void> {
    const zoneId = await this.getZoneId(domain)

    const recordGroupWithSameNameType = records.reduce((acc, record) => {
      const key = `${record.name}-${record.type}`
      acc[key] = acc[key] ?? []
      acc[key].push(record)
      return acc
    }, {} as Record<string, DnsRecord[]>)

    const recordSets: CreateRSetBatchLinesReq[] = []

    for (const key in recordGroupWithSameNameType) {
      const records = recordGroupWithSameNameType[key]

      const recordGroupWithSameLineTtl = records.reduce((acc, record) => {
        const key = `${record.line}-${record.ttl}`
        acc[key] = acc[key] ?? []
        acc[key].push(record)
        return acc
      }, {} as Record<string, DnsRecord[]>)

      const lines: BatchCreateRecordSetWithLine[] = []

      for (const recordKey of Object.keys(recordGroupWithSameLineTtl)) {
        const initialRecord = recordGroupWithSameLineTtl[recordKey][0]
        const records = recordGroupWithSameLineTtl[recordKey]

        lines.push(
          new BatchCreateRecordSetWithLine()
            .withLine(this.ispMap[initialRecord.line] ?? initialRecord.line)
            .withTtl(initialRecord.ttl ?? 300)
            .withRecords(records.map((record) => record.value)),
        )
      }

      const recordName = records[0].name === '@'
        ? domain + '.'
        : records[0].name + '.' + domain + '.'
      const recordSet = new CreateRSetBatchLinesReq()
        .withName(recordName)
        .withType(records[0].type)
        .withLines(lines)

      recordSets.push(recordSet)
    }

    for (const recordSet of recordSets) {
      await this.client.createRecordSetWithBatchLines(
        new CreateRecordSetWithBatchLinesRequest()
          .withZoneId(zoneId)
          .withBody(recordSet),
      )
    }
  }

  async removeRecords(domain: string, recordIds: string[]): Promise<void> {
    const zoneId = await this.getZoneId(domain)

    // send a http DELETE request with body will crash the Deno node-http compatibility layer
    // https://github.com/denoland/deno/issues/22565
    // https://console-intl.huaweicloud.com/apiexplorer/#/openapi/DNS/debug?api=BatchDeleteRecordSetWithLine
    // so DON'T use follow code util Deno fix this issue or Huawei Cloud change their API

    // await this.client.batchDeleteRecordSetWithLine(
    //   new BatchDeleteRecordSetWithLineRequest()
    //     .withZoneId(zoneId)
    //     .withBody(new BatchDeleteRecordSetWithLineRequestBody()
    //       .withRecordsetIds(recordIds)),
    // )

    for (const recordId of recordIds) {
      console.log('Deleting record:', recordId)
      await this.client.deleteRecordSets(
        new DeleteRecordSetsRequest()
          .withZoneId(zoneId)
          .withRecordsetId(recordId),
      )
    }
  }

  async getRecords(
    domain: string,
    type?: DnsRecordType,
    line?: string,
    name?: string,
  ): Promise<DnsRecordDto[]> {
    const zoneId = await this.getZoneId(domain)

    const showRequest = new ShowRecordSetByZoneRequest()
      .withZoneId(zoneId)
      .withLimit(500)

    showRequest.type = type
    showRequest.name = name
    showRequest.lineId = line

    let records: ShowRecordSetByZoneResp[] = []
    const initialRecords = await this.client.showRecordSetByZone(showRequest)
    const pageToFetch = Math.ceil(
      initialRecords.metadata?.totalCount! / showRequest.limit!,
    )

    records = records.concat(initialRecords.recordsets!)

    for (let index = 1; index < pageToFetch; index++) {
      const response = await this.client.showRecordSetByZone(
        showRequest.withOffset(index * showRequest.limit!),
      )

      records = records.concat(response.recordsets!)
    }

    return records.map((record) => this.toDnsRecord(record, domain))
  }

  private toDnsRecord(
    record: ShowRecordSetByZoneResp,
    domain: string,
  ): DnsRecordDto {
    const line = this.ispMap[record.line!] ?? record.line!

    const recordName = record.name === `${domain}.`
      ? '@'
      : record.name!.replace(`.${domain}.`, '')

    return {
      id: record.id!,
      name: recordName,
      type: record.type!,
      ttl: record.ttl!,
      line: line,
      value: record.records![0],
    }
  }

  private async getZoneId(domain: string): Promise<string> {
    const zones = await this.client.listPublicZones(
      new ListPublicZonesRequest().withName(domain),
    )
    const zone = zones.zones?.find((zone) => zone.name === domain + '.')

    if (!zone || !zone.id) {
      throw new Error(`Zone not found: ${domain}`)
    }

    return zone.id
  }
}
