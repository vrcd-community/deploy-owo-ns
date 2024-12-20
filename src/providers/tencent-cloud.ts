import { type DomainDeploySchema } from '../types/config.ts'
import { DnsProvider } from '../types/dns-provider.ts'
import { DnsRecord, DnsRecordDto, DnsRecordType } from '../types/dns-record.ts'

import { dnspod } from 'tencentcloud-sdk-nodejs-dnspod'

import {
  AddRecordBatch,
  RecordListItem,
} from 'tencentcloud-sdk-nodejs-dnspod/tencentcloud/services/dnspod/v20210323/dnspod_models.d.ts'

export default class TencentCloudDnsProvider implements DnsProvider {
  readonly id: string = 'tencent-cloud'
  readonly name: string = 'Tencent Cloud (DnsPod)'

  private readonly client

  private readonly ispMap: Record<string, string> = {
    '中国电信': '电信',
    '中国联通': '联通',
    '中国移动': '移动',
    '中国教育和科研计算机网': '教育网',
    '中国科技网': '科技网',
  }

  constructor(env: Record<string, string>, config: DomainDeploySchema) {
    this.client = new dnspod.v20210323.Client({
      credential: {
        secretId: env['TENCENT_CLOUD_SECRET_ID'] ?? '',
        secretKey: env['TENCENT_CLOUD_SECRET_KEY'] ?? '',
      },
    })

    this.ispMap = Object.assign(this.ispMap, config.ispMap)
  }

  async addRecords(domain: string, records: DnsRecord[]): Promise<void> {
    const domainInfo = await this.client.DescribeDomain({
      Domain: domain,
    })

    const domainId = domainInfo.DomainInfo?.DomainId

    if (!domainId) {
      throw new Error('DomainId not found')
    }

    const recordsToAdd = records.map((record) => ({
      SubDomain: record.name,
      RecordType: record.type,
      Value: record.value,
      RecordLine: this.ispMap[record.line] ?? record.line,
      TTL: record.ttl,
      Weight: record.weight,
    } as AddRecordBatch))

    const createBatchTaskResponse = await this.client.CreateRecordBatch({
      DomainIdList: [domainId.toString()],
      RecordList: recordsToAdd,
    })

    console.log(
      'Add records batch task created, JobId:',
      createBatchTaskResponse.JobId,
    )

    if (createBatchTaskResponse.JobId === undefined) {
      throw new Error('JobId not found')
    }

    console.log('Waiting for task to complete...')
    await this.waitTaskComplete(createBatchTaskResponse.JobId)
  }

  async removeRecords(_domain: string, recordIds: string[]): Promise<void> {
    const removeBatchTaskResponse = await this.client.DeleteRecordBatch({
      RecordIdList: recordIds.map((id) => parseInt(id)),
    })

    console.log(
      'Remove records batch task created, JobId:',
      removeBatchTaskResponse.JobId,
    )

    if (removeBatchTaskResponse.JobId === undefined) {
      throw new Error('JobId not found')
    }

    console.log('Waiting for task to complete...')
    await this.waitTaskComplete(removeBatchTaskResponse.JobId)
  }

  async getRecords(
    domain: string,
    type?: DnsRecordType,
    line?: string,
    name?: string,
  ): Promise<DnsRecordDto[]> {
    const limit = 3000
    let records: DnsRecordDto[] = []

    const initialResponse = await this.client.DescribeRecordList({
      Domain: domain,
      Limit: limit,
      Offset: 0,
      RecordLine: line,
      RecordType: type,
      Subdomain: name,
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

  private async waitTaskComplete(jobId: number): Promise<void> {
    let taskCompleted = false
    while (!taskCompleted) {
      const task = await this.client.DescribeBatchTask({
        JobId: jobId,
      })

      if (
        task.SuccessCount === undefined || task.FailCount === undefined ||
        task.TotalCount === undefined
      ) {
        throw new Error('Task info response invalid')
      }

      if ((task.SuccessCount + task.FailCount) === task.TotalCount) {
        taskCompleted = true

        if (task.FailCount > 0) {
          throw new Error(
            'Task failed, see DnsPod Console for more information',
          )
        }
      }

      // wait 5s
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}
