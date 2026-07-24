# Kiro × MX Creative Console — Technical Design

## 1. Sistem Mimarisi (High-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KULLANICI                                    │
│                    (MX Creative Console)                             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ USB/Bluetooth
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   LOGI PLUGIN SERVICE                                │
│              (Logi Options+ background process)                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ WebSocket (IPC)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│               KIRO MX PLUGIN (Node.js/TypeScript)                   │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Actions    │  │ Animation  │  │ State        │  │ Config    │  │
│  │ Handler    │  │ Engine     │  │ Manager      │  │ Manager   │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
└────────┼────────────────┼────────────────┼─────────────────┼────────┘
         │                │                │                 │
         └────────────────┴────────┬───────┴─────────────────┘
                                   │ WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BRIDGE SERVICE (Node.js)                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐                  │
│  │ MCP Server │  │ ACP Client │  │ Session      │                  │
│  │ (for Kiro) │  │            │  │ Monitor      │                  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘                  │
└────────┼────────────────┼────────────────┼──────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      KIRO (IDE / CLI)                                │
│  ┌─────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Hooks   │  │ ACP    │  │ MCP     │  │ Skills   │  │Steering │  │
│  └─────────┘  └────────┘  └─────────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 2. Bileşen Detayları

### 2.1 Kiro MX Plugin (Logi Actions SDK)

**Teknoloji:** TypeScript, `@logitech/plugin-sdk`
**Konum:** `packages/logi-plugin/`

```
packages/logi-plugin/
├── src/
│   ├── index.ts                 # Plugin entry point
│   ├── actions/
│   │   ├── prompt-button.ts     # CommandAction — 9 LCD buton basımları
│   │   ├── dial-navigate.ts     # AdjustmentAction — session navigasyonu
│   │   ├── roller-model.ts      # AdjustmentAction — model seçimi
│   │   ├── stop-action.ts       # CommandAction — Stop/Cancel
│   │   ├── autopilot-toggle.ts  # CommandAction — Autopilot on/off
│   │   ├── undo-action.ts       # CommandAction — Undo
│   │   ├── redo-action.ts       # CommandAction — Redo
│   │   └── page-nav.ts          # CommandAction — < > sayfa geçiş
│   ├── display/
│   │   ├── lcd-renderer.ts      # 9 buton LCD içerik yönetimi
│   │   ├── animation-engine.ts  # Hayalet animasyon frame yönetimi
│   │   ├── ghost-sprites.ts     # Hayalet ikon sprite'ları (yüz ifadeleri)
│   │   ├── tile-composer.ts     # 3x3 grid → tek canvas bölme
│   │   └── pulse-effect.ts      # Parlaklık pulse efekti
│   ├── state/
│   │   ├── kiro-state.ts        # Kiro durum makinesi (idle/working/waiting)
│   │   ├── page-manager.ts      # Buton sayfa yönetimi
│   │   ├── session-list.ts      # Session listesi cache
│   │   └── config-store.ts      # Kullanıcı konfigürasyonu
│   └── bridge/
│       └── bridge-client.ts     # Bridge Service WebSocket client
├── assets/
│   ├── sprites/                 # Hayalet animasyon frame'leri (PNG)
│   ├── icons/                   # Buton ikonları
│   └── fonts/                   # Buton metin fontları
├── assets.yml
├── package.json
└── tsconfig.json
```


---

### 2.2 Bridge Service

**Teknoloji:** Node.js/TypeScript
**Konum:** `packages/bridge/`
**Rolü:** Logi Plugin ile Kiro arasında çift yönlü köprü

```
packages/bridge/
├── src/
│   ├── index.ts                 # Entry point
│   ├── ws-server.ts             # WebSocket server (plugin bağlanır)
│   ├── acp-client.ts            # Kiro ACP JSON-RPC client
│   ├── mcp-server.ts            # MCP server (Kiro bağlanır)
│   ├── session-monitor.ts       # Session health izleme
│   ├── hook-listener.ts         # Hook command çıktılarını dinleme
│   └── types.ts                 # Paylaşımlı tipler
├── package.json
└── tsconfig.json
```

**İletişim Akışı:**

```
Plugin → Bridge: { type: "button_press", button: 3, page: 1 }
Bridge → Kiro:   ACP session/prompt { content: "/refactor" }

Kiro → Bridge:   ACP notification { type: "TurnEnd" }
Bridge → Plugin: { type: "state_change", state: "idle" }

Kiro → Bridge:   Hook command stdout: "waiting_for_input"
Bridge → Plugin: { type: "state_change", state: "waiting", options: ["Trust","Cancel"] }
```


---

### 2.3 Kiro MCP Server

**Teknoloji:** Node.js/TypeScript
**Rolü:** Kiro agent'ın doğrudan LCD'ye yazabilmesi

**Araçlar (Tools):**

```typescript
// mx_send_notification — LCD'de kısa bildirim göster
{
  name: "mx_send_notification",
  description: "Show a notification on MX Creative Console LCD buttons",
  inputSchema: {
    message: string,      // Kısa metin (max 20 karakter)
    icon?: string,        // Emoji veya preset ikon adı
    duration?: number,    // Gösterim süresi (ms)
    style?: "info" | "success" | "warning" | "error"
  }
}

// mx_update_buttons — Buton içeriklerini güncelle
{
  name: "mx_update_buttons",
  description: "Update LCD button labels and icons",
  inputSchema: {
    buttons: Array<{ index: number, label: string, icon?: string }>
  }
}

// mx_show_animation — Animasyon tetikle
{
  name: "mx_show_animation",
  description: "Trigger an animation on the LCD grid",
  inputSchema: {
    animation: "ghost_walk" | "fire" | "celebration" | "thinking" | "error",
    duration?: number
  }
}

// mx_set_status — Genel durum ayarla
{
  name: "mx_set_status",
  description: "Set the overall status displayed on MX Console",
  inputSchema: {
    state: "idle" | "working" | "waiting" | "error" | "success",
    message?: string
  }
}
```


---

### 2.4 Kiro Hooks Konfigürasyonu

**Konum:** `.kiro/hooks/mx-console.json`

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "mx-agent-start",
      "trigger": "UserPromptSubmit",
      "action": {
        "type": "command",
        "command": "curl -s http://localhost:9847/state/working"
      },
      "enabled": true
    },
    {
      "name": "mx-agent-stop",
      "trigger": "Stop",
      "action": {
        "type": "command",
        "command": "curl -s http://localhost:9847/state/idle"
      },
      "enabled": true
    },
    {
      "name": "mx-pre-tool",
      "trigger": "PreToolUse",
      "matcher": ".*",
      "action": {
        "type": "command",
        "command": "curl -s http://localhost:9847/state/tool-running"
      },
      "enabled": true
    },
    {
      "name": "mx-task-done",
      "trigger": "PostTaskExec",
      "action": {
        "type": "command",
        "command": "curl -s http://localhost:9847/state/task-complete"
      },
      "enabled": true
    }
  ]
}
```


---

### 2.5 Kiro Power Paketi

**Konum:** `packages/kiro-power/`

```
packages/kiro-power/
├── POWER.md                          # Power açıklaması + keywords
├── mcp.json                          # MCP server konfigürasyonu
├── hooks/
│   └── mx-console.json              # Hook tanımları
├── steering/
│   ├── criticize.md                  # "Dürüst ol, eleştir"
│   ├── refactor.md                   # "Refactor et"
│   ├── test-write.md                 # "Test yaz"
│   ├── explain.md                    # "Açıkla"
│   ├── optimize.md                   # "Performans optimize et"
│   ├── review.md                     # "Kod review yap"
│   ├── document.md                   # "Dokümante et"
│   ├── simplify.md                   # "Basitleştir"
│   └── security.md                   # "Güvenlik açığı ara"
├── skills/
│   ├── mx-prompt/SKILL.md            # MX Console prompt skill
│   └── mx-session/SKILL.md           # MX Console session skill
└── agents/
    └── mx-console-companion.md       # Companion agent (P3)
```

**POWER.md:**
```markdown
---
name: mx-creative-console
description: Logitech MX Creative Console entegrasyonu. LCD butonlardan prompt gönder, dial ile session gezin, Kiro durumunu fiziksel cihazda takip et.
keywords: ["mx console", "creative console", "logitech", "hardware", "dial", "lcd"]
---

# MX Creative Console Power

MX Creative Console'u Kiro'ya bağlar. LCD butonlara prompt/skill atar,
dial ile session'lar arası gezer, Kiro durumunu animasyonlarla gösterir.

## Gereksinimler
- Logitech MX Creative Console
- Logi Options+ yüklü
- Bridge Service çalışıyor

## Kurulum
1. Power'ı yükle (one-click)
2. Bridge Service'i başlat: `npx kiro-mx-bridge`
3. Logi Options+'dan plugin'i etkinleştir
```


---

## 3. State Machine (Durum Makinesi)

```
                    ┌──────────────┐
                    │              │
            ┌──────►    IDLE      ◄───────────┐
            │       │              │           │
            │       └──────┬───────┘           │
            │              │                   │
            │     UserPromptSubmit /           │
            │     Button press                 │
            │              │                   │
            │              ▼                   │
            │       ┌──────────────┐           │
            │       │              │      TurnEnd /
       Cancel/      │   WORKING    │      TaskComplete
       Stop         │              │           │
            │       └──────┬───────┘           │
            │              │                   │
            │       Agent needs input          │
            │              │                   │
            │              ▼                   │
            │       ┌──────────────┐           │
            │       │              │           │
            └───────┤   WAITING    ├───────────┘
                    │              │
                    └──────────────┘
                   User responds (button)
```

**State → LCD Mapping:**

| State | LCD Görseli | Fiziksel Efekt |
|-------|-------------|----------------|
| IDLE | Prompt kısayolları sayfası | LED'ler sabit |
| WORKING | Hayalet kayma animasyonu | — |
| WAITING | Dinamik cevap butonları | LCD pulse efekti |
| ERROR | Kırmızı arka plan + şaşkın hayalet | Hızlı pulse |
| SUCCESS | Yeşil flash + mutlu hayalet | Tek flash |


---

## 4. Animasyon Sistemi

### 4.1 Hayalet Kayma Animasyonu (Working State)

9 LCD buton = 1 canvas (ör: 360x360px veya 480x480px)

```
Frame üretimi:
- Hayalet sprite: 360x360px (tüm canvas boyutu)
- Canvas genişliği: 360px
- Toplam animasyon genişliği: 360 (canvas) + 360 (sprite) = 720px
- Frame sayısı: 30 (12 FPS = ~2.5 saniyelik loop)
- Her frame'de sprite X offset değişir

Frame 0:  sprite X = +360 (tamamen sağ dışında)
Frame 10: sprite X = +120 (sağdan giriyor)
Frame 15: sprite X = 0   (ortada, tam görünür)
Frame 20: sprite X = -120 (sola kayıyor)
Frame 30: sprite X = -360 (tamamen sol dışında) → loop

Her frame 3x3 tile'a bölünür:
┌────┬────┬────┐
│ T1 │ T2 │ T3 │  Her tile = 120x120px
├────┼────┼────┤
│ T4 │ T5 │ T6 │  Buton 1=T1, Buton 2=T2, ... Buton 9=T9
├────┼────┼────┤
│ T7 │ T8 │ T9 │
└────┴────┴────┘
```

### 4.2 Fire/Burning Efekti (Session Uyarı)

```
- Arka plan: siyah → turuncu → kırmızı gradient animasyonu
- Üzerinde: "Session çok uzadı!" metni
- Alt butonlarda: "Yeni Session" | "Compact" | "Devam"
- Frame sayısı: 20 (flicker efekti)
```

### 4.3 Pulse Efekti (Waiting State)

```
- Tüm 9 butonun parlaklığı senkronize sinüs dalgası
- Periyot: 2 saniye (yavaş nefes)
- Acil modda: 0.5 saniye (hızlı yanıp sönme)
- Parlaklık aralığı: %30 — %100
```


---

## 5. Session Health Monitor

### 5.1 Metrikler

```typescript
interface SessionHealth {
  tokenCount: number;        // Tahmini token sayısı
  messageCount: number;      // Toplam mesaj sayısı
  duration: number;          // Session süresi (dakika)
  lastCompaction: Date;      // Son compact zamanı
}
```

### 5.2 Threshold'lar

| Seviye | Token | Mesaj | LCD Gösterge |
|--------|-------|-------|--------------|
| Normal | 0-30K | 0-20 | Yeşil nokta (küçük, köşede) |
| Dikkat | 30K-50K | 20-40 | Sarı/turuncu çubuk |
| Uyarı | 50K-70K | 40-60 | Turuncu yanıp sönen çubuk |
| Kritik | 70K+ | 60+ | 🔥 Fire animasyonu + aksiyon butonları |

### 5.3 Veri Kaynağı

```
~/.kiro/sessions/cli/<session-id>.jsonl  → satır sayısı = mesaj sayısı tahmini
ACP TurnEnd notification → token usage bilgisi (varsa)
Session başlangıç zamanı → süre hesaplama
```


---

## 6. Konfigürasyon

### 6.1 Kullanıcı Konfigürasyonu

**Konum:** `~/.kiro-mx/config.json`

```json
{
  "bridge": {
    "port": 9847,
    "host": "localhost"
  },
  "pages": [
    {
      "name": "Prompts",
      "buttons": [
        { "index": 0, "type": "skill", "value": "/criticize", "label": "Eleştir", "icon": "🔍" },
        { "index": 1, "type": "skill", "value": "/refactor", "label": "Refactor", "icon": "♻️" },
        { "index": 2, "type": "skill", "value": "/test-write", "label": "Test Yaz", "icon": "🧪" },
        { "index": 3, "type": "skill", "value": "/explain", "label": "Açıkla", "icon": "💡" },
        { "index": 4, "type": "skill", "value": "/fix-bug", "label": "Fix Bug", "icon": "🐛" },
        { "index": 5, "type": "skill", "value": "/optimize", "label": "Optimize", "icon": "⚡" },
        { "index": 6, "type": "skill", "value": "/review", "label": "Review", "icon": "👀" },
        { "index": 7, "type": "skill", "value": "/document", "label": "Dokümante", "icon": "📝" },
        { "index": 8, "type": "skill", "value": "/simplify", "label": "Basitleştir", "icon": "✂️" }
      ]
    },
    {
      "name": "IDE",
      "buttons": [
        { "index": 0, "type": "shortcut", "value": "shift+cmd+l", "label": "Open Chat" },
        { "index": 1, "type": "shortcut", "value": "cmd+i", "label": "Inline Chat" },
        { "index": 2, "type": "shortcut", "value": "shift+cmd+p", "label": "Commands" },
        { "index": 3, "type": "shortcut", "value": "cmd+p", "label": "Go to File" },
        { "index": 4, "type": "shortcut", "value": "shift+cmd+f", "label": "Find" },
        { "index": 5, "type": "shortcut", "value": "f5", "label": "Debug" },
        { "index": 6, "type": "shortcut", "value": "cmd+,", "label": "Settings" },
        { "index": 7, "type": "shortcut", "value": "ctrl+`", "label": "Terminal" },
        { "index": 8, "type": "shortcut", "value": "ctrl+cmd+f", "label": "Full Screen" }
      ]
    },
    {
      "name": "Git",
      "buttons": [
        { "index": 0, "type": "command", "value": "git-commit", "label": "Commit" },
        { "index": 1, "type": "command", "value": "git-push", "label": "Push" },
        { "index": 2, "type": "command", "value": "git-pull", "label": "Pull" },
        { "index": 3, "type": "command", "value": "create-pr", "label": "Create PR" }
      ]
    }
  ],
  "dialpad": {
    "dial": "session-navigate",
    "roller": "model-select",
    "topLeft1": "undo",
    "topLeft2": "redo",
    "bottomLeft": "autopilot-toggle",
    "bottomRight": "stop-cancel"
  },
  "sessionHealth": {
    "warnAt": 30000,
    "alertAt": 50000,
    "criticalAt": 70000
  },
  "animations": {
    "ghostSpeed": 2500,
    "pulseSpeed": 2000,
    "pulseUrgentSpeed": 500
  }
}
```


---

## 7. Veri Akış Diyagramları

### 7.1 Buton Basımı → Kiro'ya Prompt

```
1. Kullanıcı LCD buton 2'ye basar (sayfa 1)
2. Logi Plugin Service → Plugin: onKeyDown() tetiklenir
3. Plugin config'den bakar: buton 2, sayfa 1 = "/refactor"
4. Plugin → Bridge: { type: "button_press", action: "skill", value: "/refactor" }
5. Bridge → Kiro ACP: session/prompt { content: "/refactor" }
6. Kiro prompt'u işler
7. Bridge durum dinler: AgentMessageChunk → TurnEnd
8. Bridge → Plugin: { type: "state_change", state: "idle" }
9. Plugin LCD'yi günceller: animasyon durur, prompt butonları gösterilir
```

### 7.2 Kiro Cevap Bekliyor → Dinamik Butonlar

```
1. Kiro "Trust this tool?" bekliyor (PreToolUse)
2. Hook tetiklenir → curl http://localhost:9847/state/waiting
3. Bridge → Plugin: { type: "waiting", options: ["Trust", "Cancel", "Always Trust"] }
4. Plugin LCD'yi günceller: 
   - Buton 0: "✅ Trust"
   - Buton 1: "❌ Cancel"  
   - Buton 2: "🔓 Always Trust"
   - Diğerleri: boş
   - Pulse efekti başlar
5. Kullanıcı buton 0'a basar
6. Plugin → Bridge: { type: "response", value: "trust" }
7. Bridge → Kiro: İlgili onay gönderilir
8. Plugin normal moda döner
```

### 7.3 Session Navigasyonu (Dial)

```
1. Kullanıcı dial'ı saat yönünde 3 tick çevirir
2. Logi Plugin Service → Plugin: execute(event) { tick: 3 }
3. Plugin session listesini alır (cache'den)
4. Aktif session index += 3
5. Plugin → Bridge: { type: "session_switch", sessionId: "sess_xyz" }
6. Bridge → Kiro ACP: session/load { sessionId: "sess_xyz" }
7. Kiro session'ı yükler
8. Bridge → Plugin: { type: "session_loaded", name: "MX Plugin Dev", index: 12 }
9. Plugin LCD'de kısa süre session bilgisini gösterir
```


---

## 8. Teknoloji Stack

| Katman | Teknoloji | Sebep |
|--------|-----------|-------|
| Logi Plugin | TypeScript + @logitech/plugin-sdk | Resmi SDK, hot-reload |
| Bridge Service | Node.js + TypeScript | Aynı runtime, paylaşımlı tipler |
| WebSocket | ws (npm) | Hızlı, düşük latency |
| MCP Server | @modelcontextprotocol/sdk | Resmi MCP SDK |
| ACP Client | JSON-RPC 2.0 over stdio | Kiro native protokolü |
| Sprite/Animasyon | Canvas API (node-canvas) veya pre-rendered PNG | LCD performansı |
| Konfigürasyon | JSON + JSON Schema | Validation, IDE autocomplete |
| Paketleme | npm workspaces (monorepo) | Tek repo, paylaşımlı kod |

---

## 9. Monorepo Yapısı

```
mxkiro/
├── packages/
│   ├── logi-plugin/          # Logi Actions SDK plugin
│   ├── bridge/               # Bridge service (WebSocket + ACP + MCP)
│   ├── shared/               # Paylaşımlı tipler ve utility'ler
│   └── kiro-power/           # Kiro Power paketi (hooks, steering, skills)
├── assets/
│   ├── sprites/              # Hayalet animasyon frame'leri
│   ├── icons/                # Buton ikonları
│   └── animations/           # Pre-rendered animasyon setleri
├── scripts/
│   ├── generate-sprites.ts   # Sprite sheet üretici
│   └── dev.ts                # Geliştirme ortamı başlatıcı
├── package.json              # Monorepo root (npm workspaces)
├── tsconfig.base.json
└── .kiro/
    ├── specs/
    │   └── kiro-mx-console/
    │       ├── requirements.md
    │       └── design.md
    ├── hooks/
    │   └── mx-console.json
    ├── steering/
    │   └── mx-console-dev.md
    └── settings/
        └── mcp.json
```

---

## 10. Geliştirme ve Test

### 10.1 Geliştirme Akışı

```bash
# 1. Monorepo bağımlılıklarını yükle
npm install

# 2. Bridge service'i başlat (background)
npm run dev:bridge

# 3. Logi plugin'i watch modda başlat
npm run dev:plugin
# Bu otomatik olarak Logi Plugin Service'e bağlanır

# 4. Kiro MCP server'ı .kiro/settings/mcp.json'a ekle
# (otomatik olarak Power kurulumunda yapılır)
```

### 10.2 Test Stratejisi

| Katman | Test Tipi | Araç |
|--------|-----------|------|
| Shared types | Unit | Vitest |
| Bridge logic | Unit + Integration | Vitest + mock WebSocket |
| ACP client | Integration | Kiro CLI headless mode |
| Plugin actions | Manual | Logi Options+ developer mode |
| Animasyonlar | Visual | Sprite preview tool |
| E2E | Manual | Gerçek cihaz + Kiro IDE |
