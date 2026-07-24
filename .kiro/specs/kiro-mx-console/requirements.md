# Kiro × MX Creative Console — Requirements

## 1. Proje Özeti

Kiro IDE/CLI ile Logitech MX Creative Console arasında iki yönlü entegrasyon sağlayan bir plugin sistemi. Kullanıcı, MX Creative Console'un fiziksel kontrolleri (LCD butonlar, dial, roller, fiziksel butonlar) üzerinden Kiro'ya prompt gönderebilir, session yönetimi yapabilir, onay/red verebilir ve Kiro'nun çalışma durumunu fiziksel cihaz üzerinde görsel olarak takip edebilir.

**İlham kaynağı:** OpenAI Codex Micro ($230, Work Louder) — ancak bizim projemiz LCD ekranlı butonlar sayesinde çok daha zengin bir deneyim sunacak.

---

## 2. Kullanıcı Gereksinimleri

### REQ-1: Prompt Kısayolları (Keypad LCD Butonlar)

**Açıklama:** Kullanıcı, keypad'deki 9 LCD butona önceden tanımlı prompt'lar/skill'ler atayabilir. Butona basıldığında ilgili prompt Kiro chat'ine otomatik gönderilir.

**Kabul Kriterleri:**
- 9 LCD butonun her birine farklı bir prompt/skill atanabilir
- Buton üzerinde prompt'un kısa adı (metin) ve ikonla gösterilir
- Butona basınca ilgili skill (`/skill-name`) veya steering (`#steering-name`) Kiro'ya gönderilir
- `<` `>` navigasyon butonlarıyla birden fazla sayfa (prompt seti) arasında geçiş yapılabilir
- Context-aware: Çalışılan dosya tipine göre (.tsx, .test.ts, .py vb.) buton seti otomatik değişebilir (fileMatch steering entegrasyonu)

---

### REQ-2: Kiro Durum Göstergesi — Hayalet Animasyonu

**Açıklama:** Kiro çalışırken (agent working state), 9 LCD butonun tamamı tek bir büyük canvas olarak kullanılır ve Kiro hayalet ikonu (mor arka plan, beyaz hayalet, siyah gözler) ekranda sağdan sola kayarak loop yapar.

**Kabul Kriterleri:**
- 9 LCD buton birleştirilerek tek bir büyük görsel alan olarak kullanılır
- Hayalet ikon tüm 3x3 alanı kaplar (büyük ikon)
- Animasyon: hayalet sağdan girip sola doğru kayar, ekrandan çıkar, arkadan dolanıp tekrar sağdan girer (sonsuz loop)
- Kiro idle olduğunda animasyon durur, prompt butonları sayfası gösterilir
- Kiro iş bitirdiğinde animasyon durur ve tamamlanma göstergesi gösterilir

---

### REQ-3: Kiro Visual Language — Yüz İfadeleri ile İletişim

**Açıklama:** Kiro hayalet ikonu, farklı yüz ifadeleri ve hareketlerle kullanıcıya durumu görsel olarak bildirir.

**Kabul Kriterleri:**
- Farklı durum ifadeleri: düşünüyor (gözler yukarı), mutlu (kavisli gözler), şaşkın (büyük gözler), kızgın/kritik (kısık gözler), hata (spiral gözler)
- Hareket animasyonları: zıplama (dikkat), sallanma (hayır), baş sallama (evet), büyüyüp küçülme (önemli bilgi)
- Kombinasyonlar durum bazlı tetiklenir (test geçti = mutlu + zıplama, kritik hata = büyük gözler + kırmızı arka plan)

---

### REQ-4: Dinamik Onay/Cevap Butonları

**Açıklama:** Kiro kullanıcıdan onay veya seçim beklediğinde (Trust, Cancel, Keep Iterating vb.), LCD butonlar dinamik olarak cevap seçeneklerine dönüşür.

**Kabul Kriterleri:**
- Kiro cevap beklediğinde (warning state) LCD butonlar otomatik olarak cevap moduna geçer
- Mevcut seçenekler (Trust / Cancel / Keep Iterating / Option A/B/C) butonlarda gösterilir
- Butona basınca ilgili cevap Kiro'ya ACP üzerinden gönderilir
- Cevap verildikten sonra butonlar normal prompt kısayollarına döner

---

### REQ-5: LCD Buton Pulse / Bildirim Efekti

**Açıklama:** Kiro kullanıcıdan cevap beklediğinde, 9 LCD butonun ekranları yanıp sönerek (pulse) dikkat çeker.

**Kabul Kriterleri:**
- Kiro warning/waiting state'e geçtiğinde tüm 9 LCD buton parlaklık pulse'ı yapar (nefes alır gibi)
- Acil durumda (kritik hata, trust gerekli) pulse hızlanır
- Normal çalışma sırasında pulse yok, sadece bekleme anında aktif
- Kullanıcı butona bastığında pulse durur

---

### REQ-6: Session Navigasyonu (Dial)

**Açıklama:** Dialpad'in büyük döner kadranı (dial) ile Kiro session'ları arasında fiziksel olarak gezinilir.

**Kabul Kriterleri:**
- Dial saat yönünde = sonraki session, ters yön = önceki session
- Dial çevrildiğinde aktif session değişir (ACP `session/load`)
- LCD ekranda (veya Kiro IDE'de) aktif session adı/numarası gösterilir
- `~/.kiro/sessions/cli/` altındaki session'lar taranır
- Dial'a basma (click) = aktif session'ı aç/onayla
- Hızlı çevirme ile 30+ session arasında akıcı geçiş

---

### REQ-7: Model Seçimi (Roller)

**Açıklama:** Roller ile Kiro'nun kullandığı AI modelini değiştirmek.

**Kabul Kriterleri:**
- Roller çevirme ile model listesinde gezinme (Opus, Sonnet, Haiku, DeepSeek vb.)
- Seçilen model ACP `session/set_model` ile değiştirilir
- LCD'de aktif model adı veya kısa göstergesi görünür
- Model değişikliği anında geçerli olur

---

### REQ-8: IDE Kısayolları (Fiziksel Butonlar + Keypad Sayfası)

**Açıklama:** Kiro'nun mevcut klavye kısayolları MX Console kontrolleri üzerinden tetiklenebilir.

**Kabul Kriterleri:**
- Fiziksel dialpad butonları: Undo, Redo, Autopilot toggle, Stop/Cancel
- Keypad sayfa 2'de IDE kontrolleri: Open Chat (⇧⌘L), Inline Chat (⌘I), Command Palette (⇧⌘P), Go to File (⌘P), Find in Files (⇧⌘F), Start Debug (F5), Terminal, Settings
- Stop/Cancel butonu Kiro'yu anında durdurur (ACP `session/cancel`)
- Autopilot toggle butonu Autopilot modunu açar/kapar

---

### REQ-9: Git İşlemleri

**Açıklama:** Keypad butonlarından hızlı git komutları çalıştırma.

**Kabul Kriterleri:**
- Git Commit butonu: Kiro'dan commit mesajı oluşturmasını iste + commit yap
- Git Push butonu
- Git Pull butonu
- Create PR butonu
- Butonlar bir keypad sayfasında (sayfa 3) gruplanır

---

### REQ-10: Agent Seçimi

**Açıklama:** Custom agent'lar arasında MX Console üzerinden geçiş.

**Kabul Kriterleri:**
- `.kiro/agents/` ve `~/.kiro/agents/` altındaki agent'lar taranır
- LCD butonlarda veya dial ile agent seçimi yapılabilir
- Aktif agent adı LCD'de gösterilir
- Agent değişikliği Kiro'ya iletilir

---

### REQ-11: Session Health Monitor

**Açıklama:** Kiro session'ı çok uzadığında LCD ekranda burning/fire efekti ile kullanıcıyı uyarır ve yeni session açmasını önerir. Kullanıcı genellikle session'ın ne kadar uzadığını fark etmez — bu özellik bunu görünür kılar.

**Kabul Kriterleri:**
- Session token/mesaj sayısı sürekli izlenir
- Belirli threshold'lar aşıldığında (örn: 40K token, 60K token, 80K token) kademeli uyarı
- İlk uyarı: LCD'de hafif sarı/turuncu gösterge
- Kritik uyarı: LCD'de 🔥 burning fire animasyon efekti (tüm 9 buton)
- Uyarı butonları gösterilir: "Yeni Session Aç" / "Compact Yap" / "Devam Et"
- Kullanıcı "Devam Et" derse uyarı geçici olarak susturulur
- Context window doluluk oranı da izlenir (ACP notifications)

---

### REQ-12: Kiro Companion — Proaktif İletişim (Gelecek Vizyon)

**Açıklama:** Kiro, çalışma pattern'ini izleyerek LCD üzerinden proaktif önerilerde bulunur — bir çalışma arkadaşı gibi. (P3 — MVP sonrası)

**Kabul Kriterleri:**
- Çalışma süresi takibi (kaç saat aralıksız)
- Burnout pattern detection (aynı dosyada tekrarlayan değişiklikler)
- Proaktif mesajlar: mola önerisi, commit hatırlatması, yaklaşım değiştir önerisi
- Hayalet yüz ifadesi + kısa metin kombinasyonu LCD'de
- Rahatsız edici değil, nazik — kapatılabilir/susturulabilir

---

## 3. Teknik Gereksinimler

### REQ-T1: Logi Actions SDK Plugin (Node.js/TypeScript)

**Açıklama:** MX Creative Console ile iletişim kuran Logi Actions SDK tabanlı plugin.

**Kabul Kriterleri:**
- `@logitech/plugin-sdk` kullanılarak Node.js/TypeScript ile geliştirilir
- CommandAction (buton basımları) ve AdjustmentAction (dial/roller) uygulanır
- LCD buton görselleri dinamik olarak güncellenir
- Animasyon frame'leri 9 buton üzerinde senkronize gösterilir
- `npm run watch` ile hot-reload geliştirme desteklenir
- `.lplug4` formatında dağıtılabilir paket oluşturulabilir

---

### REQ-T2: Bridge Service (IPC/WebSocket)

**Açıklama:** Logi Plugin ile Kiro arasında çift yönlü iletişim köprüsü.

**Kabul Kriterleri:**
- Logi Plugin (Node.js) ile Kiro CLI/MCP arasında veri akışı sağlar
- WebSocket veya Unix socket üzerinden gerçek zamanlı iletişim
- Kiro'dan gelen durum bilgilerini plugin'e iletir
- Plugin'den gelen buton basımlarını Kiro komutlarına çevirir
- Bağlantı kopma/yeniden bağlanma yönetimi

---

### REQ-T3: Kiro MCP Server

**Açıklama:** Kiro'nun doğrudan MX Console'a erişebileceği custom MCP tool server'ı.

**Kabul Kriterleri:**
- MCP protokolüne uygun tool server
- Araçlar: `mx_send_notification`, `mx_update_buttons`, `mx_show_animation`, `mx_set_status`
- Kiro agent'ı bu araçlarla doğrudan LCD'ye yazabilir
- `.kiro/settings/mcp.json` ile konfigüre edilir

---

### REQ-T4: Kiro Hooks Entegrasyonu

**Açıklama:** Kiro IDE event'lerini yakalayıp MX Console'a bildiren hook'lar.

**Kabul Kriterleri:**
- `Stop` hook → Animasyonu durdur, tamamlanma göster
- `UserPromptSubmit` hook → Çalışıyor animasyonunu başlat
- `PreToolUse` hook → Tool çalışıyor göstergesi
- `PostTaskExec` hook → Task tamamlandı bildirimi
- Hook'lar `.kiro/hooks/` altında JSON formatında tanımlı

---

### REQ-T5: Kiro ACP Entegrasyonu

**Açıklama:** Kiro CLI'ın ACP protokolü üzerinden programatik session yönetimi.

**Kabul Kriterleri:**
- `session/new` — Yeni session oluştur
- `session/load` — Session yükle (dial ile gezinme)
- `session/prompt` — Prompt gönder (buton basımı)
- `session/cancel` — İşlemi iptal et (Stop butonu)
- `session/set_model` — Model değiştir (roller)
- Session notifications dinleme: `AgentMessageChunk`, `ToolCall`, `TurnEnd`

---

### REQ-T6: Kiro Power Olarak Paketleme

**Açıklama:** Tüm entegrasyon bir Kiro Power olarak paketlenir ve dağıtılır.

**Kabul Kriterleri:**
- `POWER.md` — MX Console power açıklaması
- MCP server konfigürasyonu dahil
- Steering dosyaları (prompt setleri) dahil
- Hook tanımları dahil
- Skills (buton skill'leri) dahil
- Keywords: "mx console", "creative console", "logitech", "hardware"
- One-click install desteği

---

## 4. Donanım Mapping Özeti

### Dialpad (Sol Cihaz)

| Kontrol | Fonksiyon |
|---------|-----------|
| Dial çevirme | Session'lar arası geçiş |
| Dial basma (click) | Mesaj gönder / Session aç |
| Roller | Model seçimi / Chat scroll |
| Sol üst buton 1 | Undo |
| Sol üst buton 2 | Redo |
| Sol alt buton | Autopilot toggle |
| Sağ alt buton | Stop / Cancel |

### Keypad (Sağ Cihaz)

| Kontrol | Fonksiyon |
|---------|-----------|
| 9 LCD buton (normal mod) | Prompt kısayolları / Skills |
| 9 LCD buton (working mod) | Kiro hayalet animasyonu |
| 9 LCD buton (waiting mod) | Dinamik cevap butonları (Trust/Cancel/vb.) |
| `<` buton | Önceki sayfa |
| `>` buton | Sonraki sayfa |

### Keypad Sayfaları

| Sayfa | İçerik |
|-------|--------|
| 1 | Prompt kısayolları (Eleştir, Refactor, Test Yaz, vb.) |
| 2 | IDE kontrolleri (Open Chat, Go to File, Debug, vb.) |
| 3 | Git işlemleri (Commit, Push, Pull, PR) |
| 4 | Agent seçimi |
| Dinamik | Kiro bekleme cevap butonları (otomatik geçiş) |

---

## 5. Platform Desteği

- macOS ✅ (birincil hedef)
- Windows ✅ (ikincil)
- Logi Options+ gerekli
- Kiro IDE veya Kiro CLI gerekli
- Node.js LTS gerekli

---

## 6. Rakip Analiz

| Özellik | Codex Micro | Kiro × MX Creative Console |
|---------|-------------|----------------------------|
| Fiyat | $230 (ek donanım) | MX Creative Console zaten var |
| Ekran | Yok (sabit keycap) | 9 LCD buton (dinamik görsel) |
| Durum göstergesi | RGB LED renk | Full animasyon + yüz ifadeleri |
| Buton fonksiyonu | Sabit | Context-aware, dinamik |
| Session yönetimi | Sınırlı | Dial ile tam navigasyon |
| Model seçimi | Dial (reasoning) | Roller ile model değişimi |
| Platform | Sadece Codex | Kiro (IDE + CLI) |
| Dağıtım | Kapalı | Açık (Kiro Power) |

---

## 7. Öncelik Sıralaması

| Öncelik | Requirement | Zorluk |
|---------|-------------|--------|
| P0 (MVP) | REQ-1: Prompt kısayolları | Orta |
| P0 (MVP) | REQ-4: Dinamik onay butonları | Orta |
| P0 (MVP) | REQ-T1: Logi Plugin | Orta |
| P0 (MVP) | REQ-T2: Bridge Service | Yüksek |
| P1 | REQ-2: Hayalet animasyonu | Orta |
| P1 | REQ-5: LCD pulse bildirim | Düşük |
| P1 | REQ-6: Session navigasyonu | Orta |
| P1 | REQ-T4: Hooks entegrasyonu | Orta |
| P1 | REQ-11: Session health monitor | Orta |
| P1 | REQ-T5: ACP entegrasyonu | Yüksek |
| P2 | REQ-3: Visual language | Yüksek |
| P2 | REQ-7: Model seçimi | Düşük |
| P2 | REQ-8: IDE kısayolları | Düşük |
| P2 | REQ-9: Git işlemleri | Düşük |
| P2 | REQ-10: Agent seçimi | Düşük |
| P2 | REQ-T3: MCP Server | Orta |
| P3 | REQ-12: Kiro Companion (vizyon) | Yüksek |
| P3 | REQ-T6: Power paketleme | Düşük |
