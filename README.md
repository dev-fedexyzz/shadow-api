# Brayan api 🌱

<div align="center">
  <img src="https://raw.githubusercontent.com/El-brayan502/dat3/main/uploads/9868df-1762558122218.png" alt="Raol APIs Logo" width="120" height="120">
  
  **API sencilla y fácil de usar con integración de bot de Discord.** 
  
  [![Version](https://img.shields.io/badge/version-LATEST%207.1.0-blue.svg)](https://github.com/raolbyte/Raol-UI)
  [![Node.js](https://img.shields.io/badge/node.js-%3E%3D%2020.0.0-green.svg)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/status-online-brightgreen.svg)](https://raol-apis.vercel.app)
  [![Discord](https://img.shields.io/badge/discord-bot%20ready-7289da.svg)](https://discord.com/developers/applications)
</div>

## Tabla de contenido 

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Discord Bot Integration](#discord-bot-integration)
- [Configuration](#configuration)
- [API Key Management](#api-key-management)
- [Rate Limiting](#rate-limiting)
- [Maintenance Mode](#maintenance-mode)
- [License](#license)


### Configuration Options

#### Basic Settings
- `name` - Your API service name
- `version` - Current version number
- `description` - Brief description of your service
- `bannerImage` - Path to banner image
- `previewImage` - Path to preview image

#### Maintenance Mode
```json
"maintenance": {
  "enabled": true
}
```

#### API Settings
```json
"apiSettings": {
  "creator": "Your Team Name",
  "requireApikey": false,
  "apikey": {
    "api-key-name": {
      "rateLimit": "5000/day",
      "enabled": true
    }
  }
}
```

#### Rate Limit Formats
- `"unlimited"` - No rate limiting
- `"100/minute"` - 100 requests per minute
- `"1000/hour"` - 1000 requests per hour
- `"5000/day"` - 5000 requests per day

## API Key Management

### Enabling API Key Authentication

Set `requireApikey` to `true` in your `settings.json`:

```json
"apiSettings": {
  "requireApikey": true,
  "apikey": {
    "your-secret-key": {
      "rateLimit": "1000/day",
      "enabled": true
    }
  }
}
```

### Using API Keys

When API keys are required, include them in your requests:

```bash
curl "http://localhost:3000/ai/luminai?text=Hello&apikey=your-secret-key"
```

### API Key Responses

#### No API Key Provided (when required)
```json
{
  "status": false,
  "creator": "RaolByte",
  "error": "API key required",
  "message": "Please provide a valid API key in the query parameters"
}
```

#### Invalid API Key
```json
{
  "status": false,
  "creator": "RaolByte",
  "error": "Invalid API key",
  "message": "The provided API key is not valid or does not exist"
}
```

## Rate Limiting

### Global Rate Limiting
- **Default:** 50 requests per minute per IP
- **Window:** 1 minute
- **Bypass:** When `requireApikey` is `false`, API endpoints bypass global rate limiting

### API Key Rate Limiting
- **Configurable per key**
- **Formats:** `unlimited`, `100/minute`, `1000/hour`, `5000/day`
- **Tracking:** Per API key, not per IP

### Rate Limit Responses

#### Global Rate Limit Exceeded
```json
{
  "status": false,
  "creator": "RaolByte",
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit for this API key"
}
```

## Maintenance Mode

Enable maintenance mode to temporarily disable API access:

```json
"maintenance": {
  "enabled": true
}
```

### Maintenance Mode Behavior
- **API Endpoints:** Return 503 status with maintenance message
- **Documentation:** Shows maintenance page
- **Bypass Paths:** `/api/settings`, `/assets/`, `/src/`, `/support`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/raolbyte/Raol-UI/issues)
- **Contact:** [Support Page](https://whatsapp.com/channel/0029Vb6n9HIDJ6H6oibRvv1D)

---

<div align="center">
  <p>Made with ❤️ by <strong>RaolByte</strong></p>
  <p>
    <a href="https://github.com/raolbyte/Brayan-Api">⭐ Star this repo</a> •
    <a href="https://github.com/raolbyte/Brayan-Api/issues">🐛 Report Bug</a> •
    <a href="https://github.com/raolbyte/Brayan-Api/pulls">💡 Request Feature</a>
  </p>
</div>
