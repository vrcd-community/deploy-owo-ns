export interface CdnIpResult {
  isp: string
  v4: CdnIpItem[]
  v6: CdnIpItem[]
}

export interface CdnIpItem {
  ip: string
  tcp_latency: number
  created_at: string
}
