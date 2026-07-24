# Kiro × MX Creative Console — Implementation Tasks

## Phase 0: Proje Altyapısı

### Task 0.1: Monorepo Kurulumu ✅
- [x] `package.json` oluştur (npm workspaces: packages/*)
- [x] `tsconfig.base.json` oluştur (strict, ES2022, Node16 module)
- [x] `packages/shared/` oluştur — paylaşımlı tipler ve constants
- [x] `packages/logi-plugin/` oluştur — boş Logi plugin iskeleti
- [x] `packages/bridge/` oluştur — boş bridge service iskeleti
- [x] `packages/kiro-power/` oluştur — Power dosya yapısı
- [x] `.gitignore`, `README.md` oluştur
- [x] Geliştirme scriptleri: `dev:bridge`, `dev:plugin`, `build`

### Task 0.2: Shared Types ✅
- [x] `KiroState` enum: idle, working, waiting, error, success
- [x] `ButtonConfig` interface: index, type, value, label, icon
- [x] `PageConfig` interface: name, buttons[]
- [x] `BridgeMessage` union type: button_press, state_change, session_switch, response
- [x] `SessionInfo` interface: id, name, tokenCount, messageCount, createdAt
- [x] `AnimationType` enum: ghost_walk, fire, celebration, thinking, error


---

## Phase 1: MVP — Temel İletişim (P0)

### Task 1.1: Bridge Service — WebSocket Server ✅
- [x] `packages/bridge/src/ws-server.ts` — WebSocket server (port 9847)
- [x] Client bağlantı yönetimi (plugin bağlanır)
- [x] Mesaj routing: plugin → kiro, kiro → plugin
- [x] Bağlantı kopma/reconnect yönetimi
- [x] Basit HTTP endpoint'ler (hook'lar için): `/state/:newState`
- [x] Healthcheck endpoint: `GET /health`

### Task 1.2: Bridge Service — ACP Client ✅
- [x] `packages/bridge/src/acp-client.ts` — Kiro CLI ACP bağlantısı
- [x] `kiro-cli acp` process spawn + stdio JSON-RPC
- [x] `initialize` handshake
- [x] `session/new` — yeni session oluştur
- [x] `session/prompt` — prompt gönder
- [x] `session/cancel` — işlem iptal
- [x] Notification dinleme: `AgentMessageChunk`, `TurnEnd`, `ToolCall`
- [x] Session state parse edip bridge'e bildir

### Task 1.3: Logi Plugin — Proje Oluşturma ✅
- [x] Plugin iskelet yapısı oluşturuldu
- [x] TypeScript konfigürasyonu
- [x] `@logitech/plugin-sdk` bağımlılığı
- [ ] `assets.yml` — sprite ve ikon dosyaları için
- [ ] Plugin metadata (isim, açıklama, ikon)

### Task 1.4: Logi Plugin — Prompt Buton Actions ✅
- [x] `PromptButtonAction` class (extends CommandAction)
- [x] `onKeyDown()` → Bridge'e WebSocket mesajı gönder
- [ ] 9 buton için index parametresi ile ayrım (Logi SDK API araştırılacak)
- [ ] LCD buton görsellerini config'den oku ve göster

### Task 1.5: Logi Plugin — Sayfa Navigasyonu
- [ ] `PageNavAction` class (extends CommandAction) — `<` `>` butonları
- [ ] Aktif sayfa index'i tut
- [ ] Sayfa değişince tüm 9 buton görselini güncelle
- [ ] Sayfa bilgisini (sayfa adı, numara) kısa süre göster

### Task 1.6: End-to-End Test — Buton → Kiro
- [ ] Bridge başlat + Plugin başlat + Kiro CLI ACP başlat
- [ ] LCD butona bas → Kiro'ya prompt ulaşsın
- [ ] Kiro cevap versin → Plugin'e state değişikliği ulaşsın
- [ ] Manuel test senaryosu dokümante et


---

## Phase 2: Dinamik Butonlar + Durum Yönetimi (P0)

### Task 2.1: Plugin State Manager ✅
- [x] `packages/logi-plugin/src/state/kiro-state.ts`
- [x] State machine: IDLE → WORKING → WAITING → IDLE
- [x] State değişikliğinde LCD güncelleme tetikle
- [x] Bridge'den gelen state mesajlarını işle

### Task 2.2: Dinamik Cevap Butonları (Waiting State) ✅
- [x] Bridge'den `{ type: "waiting", options: [...] }` mesajı al
- [x] LCD butonları dinamik olarak cevap seçenekleriyle güncelle
- [x] Kullanıcı butona basınca Bridge'e `{ type: "response", value: "..." }` gönder
- [x] Cevap sonrası IDLE state'e dön, normal butonları göster

### Task 2.3: Kiro Hooks Kurulumu ✅
- [x] `.kiro/hooks/mx-console.json` oluştur
- [x] `UserPromptSubmit` → `/state/working` hook
- [x] `Stop` → `/state/idle` hook
- [x] `PreToolUse` → `/state/working` hook
- [x] `PostTaskExec` → `/state/success` hook
- [x] Hook'ların Bridge HTTP endpoint'lerine bağlandığını doğrula

### Task 2.4: Stop/Cancel Butonu ✅
- [x] Dialpad sağ alt buton → `StopAction` (CommandAction)
- [x] Bridge'e `{ type: "cancel" }` gönder
- [x] Bridge → Kiro ACP `session/cancel`
- [x] State IDLE'a döner


---

## Phase 3: Animasyonlar + Visual Feedback (P1)

### Task 3.1: Sprite Sistemi
- [ ] Hayalet sprite tasarımı (360x360px, mor arka plan, beyaz hayalet)
- [ ] Farklı yüz ifadeleri için sprite varyantları
- [ ] `assets/sprites/` klasörüne PNG olarak kaydet
- [ ] `generate-sprites.ts` script — sprite sheet → tile bölme

### Task 3.2: Hayalet Kayma Animasyonu
- [ ] `packages/logi-plugin/src/display/animation-engine.ts`
- [ ] Frame üretimi: 30 frame, sprite X offset kaydırma
- [ ] Her frame'i 3x3 tile'a böl (120x120px)
- [ ] 9 LCD butona senkronize frame gönder
- [ ] FPS kontrolü (12 FPS hedef)
- [ ] WORKING state'te başla, state değişince durdur

### Task 3.3: LCD Pulse Efekti
- [ ] `packages/logi-plugin/src/display/pulse-effect.ts`
- [ ] Sinüs dalgası ile parlaklık modülasyonu
- [ ] Normal pulse: 2s periyot
- [ ] Acil pulse: 0.5s periyot
- [ ] WAITING state'te başla, buton basıncı ile durdur

### Task 3.4: Session Health Monitor
- [ ] `packages/bridge/src/session-monitor.ts`
- [ ] `~/.kiro/sessions/cli/` dizinini izle
- [ ] Aktif session `.jsonl` dosya boyutunu/satır sayısını oku
- [ ] Threshold'ları config'den al (30K, 50K, 70K)
- [ ] Threshold aşımında Bridge → Plugin bildir
- [ ] Plugin'de fire animasyonu tetikle + aksiyon butonları göster

### Task 3.5: Fire/Burning Animasyonu
- [ ] Fire sprite frame'leri oluştur (turuncu/kırmızı gradient flicker)
- [ ] "Session çok uzadı!" metin overlay
- [ ] Alt 3 butonda aksiyon seçenekleri: "Yeni Session" / "Compact" / "Devam"
- [ ] "Yeni Session" → Bridge → ACP `session/new`
- [ ] "Compact" → Bridge → Kiro'ya `/compact` komutu gönder


---

## Phase 4: Session Navigasyonu + Model Seçimi (P1)

### Task 4.1: Session Listesi
- [ ] `packages/bridge/src/session-list.ts`
- [ ] `~/.kiro/sessions/cli/*.json` dosyalarını tara
- [ ] Session metadata parse: id, name/title, createdAt, messageCount
- [ ] Liste cache + dosya değişikliği izleme (fs.watch)
- [ ] Sıralama: son kullanılana göre

### Task 4.2: Dial — Session Navigate Action
- [ ] `DialNavigateAction` class (extends AdjustmentAction)
- [ ] `execute(event)` → `event.tick` ile session index güncelle
- [ ] Bridge'e `{ type: "session_switch", sessionId: "..." }` gönder
- [ ] Bridge → ACP `session/load`
- [ ] Dial click → aktif session onayla / aç
- [ ] LCD'de kısa süre session bilgisi göster (ad, sıra numarası)

### Task 4.3: Roller — Model Select Action
- [ ] `RollerModelAction` class (extends AdjustmentAction)
- [ ] Model listesi: ["auto", "claude-opus-4", "claude-sonnet-4", "claude-haiku-4", "deepseek-v3"]
- [ ] Roller tick → model index değiştir
- [ ] Bridge → ACP `session/set_model`
- [ ] LCD'de kısa süre aktif model adı göster

### Task 4.4: Autopilot Toggle
- [ ] Dialpad sol alt buton → `AutopilotToggleAction`
- [ ] Kiro'ya Autopilot toggle komutu gönder (klavye simülasyonu veya ACP)
- [ ] Aktif durumu takip et, LED/gösterge güncelle


---

## Phase 5: IDE Kısayolları + Git + Agent (P2)

### Task 5.1: IDE Kısayol Butonları
- [ ] Keypad sayfa 2 konfigürasyonu — IDE kontrolleri
- [ ] Kısayol simülasyonu: `child_process.exec` ile `osascript` (macOS) veya global shortcut
- [ ] Open Chat, Inline Chat, Command Palette, Go to File, Find, Debug, Terminal, Settings, Full Screen

### Task 5.2: Git İşlemleri
- [ ] Keypad sayfa 3 konfigürasyonu — Git butonları
- [ ] "Commit" → Kiro'ya `/commit` skill'i gönder (AI commit mesajı + commit)
- [ ] "Push" → shell command `git push`
- [ ] "Pull" → shell command `git pull`
- [ ] "Create PR" → Kiro'ya "Create a PR for current changes" prompt'u gönder

### Task 5.3: Agent Seçimi
- [ ] `.kiro/agents/` ve `~/.kiro/agents/` dizinlerini tara
- [ ] Agent listesini oluştur (dosya adı = agent adı)
- [ ] Keypad sayfa 4 veya dial modu ile agent seçimi
- [ ] Bridge → Kiro ACP `session/set_mode` ile agent değiştir
- [ ] LCD'de aktif agent adı göster

### Task 5.4: Undo/Redo Butonları
- [ ] Dialpad sol üst buton 1 → Undo (Cmd+Z simülasyonu)
- [ ] Dialpad sol üst buton 2 → Redo (Cmd+Shift+Z simülasyonu)


---

## Phase 6: Visual Language + MCP Server (P2)

### Task 6.1: Hayalet Yüz İfadeleri
- [ ] Sprite varyantları: normal, thinking, happy, surprised, angry, error, sleepy
- [ ] Her varyant için 360x360 PNG
- [ ] State → yüz eşlemesi: working=thinking, success=happy, error=surprised, waiting=normal

### Task 6.2: Hareket Animasyonları
- [ ] Zıplama (bounce): Y offset sinüs modülasyonu
- [ ] Sallanma (shake): X offset hızlı ileri-geri
- [ ] Baş sallama (nod): Y offset yavaş ileri-geri
- [ ] Büyüyüp küçülme (pulse-scale): Scale %80-%120 arası
- [ ] Durum kombinasyonları: success → happy + bounce, error → surprised + shake

### Task 6.3: Kiro MCP Server
- [ ] `packages/bridge/src/mcp-server.ts`
- [ ] MCP SDK ile tool tanımları: mx_send_notification, mx_update_buttons, mx_show_animation, mx_set_status
- [ ] Tool çağrıldığında Bridge → Plugin mesajı
- [ ] `.kiro/settings/mcp.json` konfigürasyonu
- [ ] Kiro agent'ın LCD'ye doğrudan yazabilmesini doğrula

### Task 6.4: Context-Aware Buton Setleri
- [ ] Aktif dosya tipini izle (Kiro hook veya dosya sistemi)
- [ ] `.tsx` → React prompt seti
- [ ] `.test.ts` → Test prompt seti
- [ ] `.py` → Python prompt seti
- [ ] Dosya tipi değişince otomatik sayfa/buton güncelle


---

## Phase 7: Power Paketleme + Dağıtım (P3)

### Task 7.1: Kiro Power Paketi
- [ ] `POWER.md` yaz — açıklama, kurulum, kullanım
- [ ] `mcp.json` — Bridge MCP server konfigürasyonu
- [ ] Steering dosyaları — 9+ prompt şablonu (manual inclusion)
- [ ] Skills — `/mx-status`, `/mx-config` gibi yardımcı skill'ler
- [ ] Hooks — event listener JSON dosyaları

### Task 7.2: Companion Agent (Vizyon)
- [ ] `.kiro/agents/mx-console-companion.md` oluştur
- [ ] Çalışma pattern analizi basit kuralları
- [ ] Session süresi, mesaj sıklığı, tekrarlayan dosya düzenlemeleri
- [ ] Proaktif mesaj threshold'ları
- [ ] LCD üzerinden kısa, nazik bildirimler

### Task 7.3: Installer / Setup Script
- [ ] `npx kiro-mx-setup` — tek komutla kurulum
- [ ] Bridge Service'i daemon olarak kaydet (launchd macOS)
- [ ] Logi plugin'i `.lplug4` olarak yükle
- [ ] Kiro Power'ı otomatik install et
- [ ] Config dosyasını oluştur (interaktif veya default)

### Task 7.4: Dokümantasyon
- [ ] README.md — Proje açıklaması, kurulum, kullanım
- [ ] CONTRIBUTING.md — Geliştirme rehberi
- [ ] Sprite oluşturma rehberi (yeni animasyon ekleme)
- [ ] Konfigürasyon referansı (tüm config alanları)
- [ ] Video demo / GIF

---

## Milestone Özeti

| Phase | Süre Tahmini | Çıktı |
|-------|--------------|--------|
| Phase 0 | 1-2 gün | Monorepo, tipler, boş iskelet |
| Phase 1 | 3-5 gün | Buton → Kiro çalışıyor (MVP core) |
| Phase 2 | 2-3 gün | Dinamik butonlar + hooks (MVP tamamlanır) |
| Phase 3 | 3-5 gün | Animasyonlar + session health |
| Phase 4 | 2-3 gün | Dial session nav + model seçimi |
| Phase 5 | 2-3 gün | IDE/Git/Agent butonları |
| Phase 6 | 4-5 gün | Visual language + MCP + context-aware |
| Phase 7 | 3-4 gün | Power paketi + installer + docs |
| **Toplam** | **~20-30 gün** | **Tam özellikli v1.0** |
