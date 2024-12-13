import z from 'zod'

import { DnsProviderConstructor } from '../types/dns-provider.ts'
import HuaweiCloudDnsProvider from './huawei-cloud.ts'
import TencentCloudDnsProvider from './tencent-cloud.ts'

export default {
  'tencent-cloud': TencentCloudDnsProvider,
  'huawei-cloud': HuaweiCloudDnsProvider,
} as Record<DnsProviderKeys, DnsProviderConstructor | undefined>

export const DnsProviderKeys = z.enum(['tencent-cloud', 'huawei-cloud'], {
  message: 'Unsupported or invalid DNS provider',
})
export type DnsProviderKeys = z.infer<typeof DnsProviderKeys>
