# deploy-ns-owo

`deploy-ns-owo` 是一个工具，用于将 ns-owo 提供的 Cloudflare IP 优选服务的 IP 信息部署到支持按照运营商创建 DNS 解析记录的 DNS 服务商。

## 功能

- 从 ns-owo 获取 Cloudflare IP 优选信息
- 支持多个 DNS 服务商（如腾讯云、华为云）
- 根据运营商创建 DNS 解析记录
- 自动删除旧的 A/AAAA 记录并添加新的记录

## 支持的 DNS 服务商

- 腾讯云 (DnsPod)
- 华为云

## 使用

确保你已经安装了 [Deno](https://deno.land/)，然后运行以下命令：

首先克隆仓库：

```sh
git clone https://github.com/vrcd-community/deploy-owo-ns.git
cd deploy-owo-ns
```

然后运行脚本：

```sh
deno run --allow-net --allow-env main.ts
```

## 配置

首先配置该环境变量：`CDN_INFO_URL`，脚本会从这个 URL 获取 CDN IP 信息。

在项目根目录下创建一个 `config.json` 文件，格式如下：

```json
{
  "example.com": {
    "provider": "tencent-cloud",
    "names": ["www", "api"],
    "maxRecords": 5,
    "ttl": 600,
    "env": {
      "TENCENT_CLOUD_SECRET_ID": "your-secret-id",
      "TENCENT_CLOUD_SECRET_KEY": "your-secret-key"
    }
  },
  "another-example.com": {
    "provider": "huawei-cloud",
    "names": ["www", "api"],
    "maxRecords": 5,
    "ttl": 600,
    "env": {
      "HUAWEICLOUD_SDK_AK": "your-access-key",
      "HUAWEICLOUD_SDK_SK": "your-secret-key",
      "HUAWEICLOUD_SDK_ENDPOINT": "your-endpoint"
    }
  }
}
```

### 配置项说明

- `provider`: DNS 服务商的名称。目前支持 `tencent-cloud` 和 `huawei-cloud`。
- `names`: 需要创建 DNS 记录的子域名列表。
- `maxRecords`: 每个子域名最多创建的记录数。
- `ttl`: DNS 记录的 TTL（生存时间）。
- `env`: 包含服务商所需的环境变量。**脚本会从当前环境变量继承。**

### DNS 提供商设置

#### 腾讯云 (tencent-cloud)

- `TENCENT_CLOUD_SECRET_ID`: 腾讯云的 Secret ID。
- `TENCENT_CLOUD_SECRET_KEY`: 腾讯云的 Secret Key。

#### 华为云 (huawei-cloud)

- `HUAWEICLOUD_SDK_AK`: 华为云的 Access Key。
- `HUAWEICLOUD_SDK_SK`: 华为云的 Secret Key。
- `HUAWEICLOUD_SDK_ENDPOINT`: 华为云的 API 端点。
