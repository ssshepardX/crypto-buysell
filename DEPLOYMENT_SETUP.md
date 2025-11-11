# Otomatik Vercel Deployment Kurulumu

GitHub Actions workflow'u kurulu ve ana branch'e her push yapıldığında otomatik olarak Vercel'e deploy edecek.

## Kurulum Adımları

### 1. Vercel Token Oluşturun
1. https://vercel.com/account/tokens adresine gidin
2. "Create Token" butonuna tıklayın
3. Token'ı kopyalayın

### 2. GitHub Secrets Ayarlayın

GitHub repository settings'inde aşağıdaki secrets'ları ekleyin:

#### Settings → Secrets and variables → Actions → New repository secret

**VERCEL_TOKEN**
- Value: Yukarıda oluşturduğunuz token

**VERCEL_ORG_ID**
- Vercel dashboard'dan projeyi açın
- URL'de org ID'yi bulun (örn: `vercel.com/your-org/...`)
- Ya da: `vercel whoami` komutu ile öğrenin

**VERCEL_PROJECT_ID**
- Vercel dashboard'dan projeyi açın
- Settings → General
- "PROJECT ID" alanından kopyalayın
- Ya da: `vercel project ls` komutu ile öğrenin

### 3. Vercel CLI ile Local Test (Opsiyonel)

```bash
# Vercel CLI'ı kur
pnpm add -g vercel

# Projeyi bağla
vercel link

# Deploy et
vercel
```

## Otomatik Workflow Açıklaması

`.github/workflows/deploy.yml` dosyası:

- **Trigger**: `main` branch'e her push
- **Steps**:
  1. Kodu checkout et
  2. pnpm yükle
  3. Node.js 18 kur
  4. Dependencies yükle
  5. Build et
  6. Vercel'e deploy et

## Push Sonrası Kontrol

Her push'tan sonra:

1. GitHub repo'ya gidin
2. "Actions" tabına tıklayın
3. Son workflow'u görün
4. Deployment durumunu izleyin
5. ✅ Başarılı olursa Vercel'de canlı olacaktır

## Sorunlarıyla İlgili

**Workflow başarısız olursa:**
- GitHub Actions → Workflow → Details'i kontrol edin
- Logs'ta hata mesajını bulun
- Genellikle eksik secret veya build hatası
- Secrets'ı kontrol edin

**Vercel deployment başarısız olursa:**
- Build logs'u Vercel dashboard'dan kontrol edin
- Environment variables eksikse ekleyin
- Build command'ı kontrol edin (`vercel.json`)
