import z from 'zod'

export const DnsProviderKeys = z.enum(['tencent-cloud', 'huawei-cloud'], {
  message: 'Unsupported or invalid DNS provider',
})
export type DnsProviderKeys = z.infer<typeof DnsProviderKeys>
