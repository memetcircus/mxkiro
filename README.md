# Kiro × MX Creative Console

Physical AI coding companion — Logitech MX Creative Console'u Kiro'ya bağlar.

## Ne Yapar?

- 🎛️ LCD butonlardan prompt/skill gönder
- 🔄 Dial ile session'lar arası gezinim
- 👻 Kiro durumunu hayalet animasyonlarıyla takip et
- 🔥 Session uzadığında fire efekti ile uyarı
- ✅ Trust/Cancel gibi onayları fiziksel butonla ver

## Mimari

```
MX Creative Console → Logi Plugin → Bridge Service → Kiro (ACP/MCP/Hooks)
```

## Gereksinimler

- macOS veya Windows
- Logitech MX Creative Console
- Logi Options+ yüklü
- Kiro IDE veya CLI
- Node.js 20+

## Geliştirme

```bash
npm install
npm run dev:bridge    # Bridge service başlat
npm run dev:plugin    # Logi plugin (watch mode)
```

## Proje Yapısı

```
packages/
├── shared/        # Paylaşımlı tipler
├── bridge/        # Bridge service (WebSocket + ACP + MCP)
├── logi-plugin/   # Logi Actions SDK plugin
└── kiro-power/    # Kiro Power paketi
```
