import { CdnIpItem, CdnIpResult } from './types/cdn-ip-result.ts'

console.log(
  String.raw`
    ___           _                   __  __         ___            ___ 
   /   \___ _ __ | | ___  _   _    /\ \ \/ _\       /___\__      __/___\
  / /\ / _ \ '_ \| |/ _ \| | | |  /  \/ /\ \ _____ //  //\ \ /\ / //  //
 / /_//  __/ |_) | | (_) | |_| | / /\  / _\ \_____/ \_//  \ V  V / \_// 
/___,' \___| .__/|_|\___/ \__, | \_\ \/  \__/     \___/    \_/\_/\___/  
           |_|            |___/                                         
  `,
)
console.log('Learn More: https://cf.owonet.work')
console.log('Github: https://github.com/vrcd-community/deploy-owo-ns\n')

const cdnInfo = await fetchCdnInfo()

printCdnInfo(cdnInfo)

function printCdnInfo(cdnInfo: CdnIpResult[]) {
  cdnInfo.forEach((item) => {
    console.log(`ISP: ${item.isp}`)
    console.log('IPv4:')
    printCdnIps(item.v4)
    console.log('IPv6:')
    printCdnIps(item.v6)
  })
}

function printCdnIps(items: CdnIpItem[]) {
  items.forEach((ip) => {
    console.log(
      `\tIP: ${ip.ip}\tTCP Latency: ${
        ip.tcp_latency.toFixed(2)
      }ms\tCreated At: ${ip.created_at}`,
    )
  })
}

async function fetchCdnInfo() {
  const cdnInfoUrl = Deno.env.get('CDN_INFO_URL')

  if (!cdnInfoUrl) {
    throw new Error('CDN_INFO_URL is required')
  }

  const cdnInfo: CdnIpResult[] = await (await fetch(cdnInfoUrl, {
    headers: {
      'User-Agent': 'deploy-ns-owo/dev',
    },
  })).json()

  return cdnInfo
}
