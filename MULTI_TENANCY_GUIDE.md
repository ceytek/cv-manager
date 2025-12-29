# Multi-Tenancy Migration Guide

## Overview
Bu guide, CV Manager sisteminin multi-tenancy (çoklu şirket) desteği ile nasıl çalıştığını açıklar.

## Database Migrations

### Migration Sırası
Aşağıdaki migration'ları **sırayla** çalıştırın:

```bash
# PostgreSQL veritabanında çalıştırın
psql -U your_user -d your_database -f migrations/008_create_companies_table.sql
psql -U your_user -d your_database -f migrations/009_create_subscription_plans_table.sql
psql -U your_user -d your_database -f migrations/010_create_company_subscriptions_table.sql
psql -U your_user -d your_database -f migrations/011_create_usage_tracking_table.sql
psql -U your_user -d your_database -f migrations/012_create_transactions_table.sql
psql -U your_user -d your_database -f migrations/013_add_company_id_to_tables.sql
psql -U your_user -d your_database -f migrations/014_migrate_data_to_default_company.sql
psql -U your_user -d your_database -f migrations/015_enforce_company_constraints.sql
```

### Migration Detayları

**008: Companies Table**
- Şirket/tenant bilgilerini tutar
- 6 karakterlik benzersiz company_code (örn: ABC123)
- Subdomain ve custom domain desteği (white-label için)
- Tema renkleri (JSONB)
- Default şirket: SYS001

**009: Subscription Plans Table**
- 4 abonelik paketi: Starter, Pro, Business, Unlimited
- CV, Job, User limitleri
- Aylık/yıllık fiyatlandırma
- Feature flags (JSONB)

**010: Company Subscriptions Table**
- Şirketlerin aktif abonelikleri
- Trial period desteği (14 gün)
- Otomatik yenileme
- Billing cycle tracking

**011: Usage Tracking Table**
- Aylık kullanım takibi
- Resource types: cv_upload, job_post, ai_analysis, user_account, api_call
- PostgreSQL fonksiyonları:
  - `get_current_usage(company_id, resource_type)`
  - `increment_usage(company_id, resource_type, increment)`

**012: Transactions Table**
- Ödeme ve fatura kayıtları
- Otomatik invoice number üretimi (INV-YYYYMM000001)
- Payment gateway entegrasyonu için metadata

**013-015: Existing Tables Update**
- Tüm tablolara company_id eklenir
- Mevcut veriler default company'ye atanır
- Foreign key constraints eklenir
- Performance indexes oluşturulur

## Backend Architecture

### Services

**CompanyService** (`app/services/company_service.py`)
- `generate_company_code()` - 6 karakterlik kod üretir
- `create_company()` - Yeni şirket oluşturur
- `get_company_by_code()` - Kod ile şirket bulur
- `update_company()` - Şirket bilgilerini günceller

**SubscriptionService** (`app/services/subscription_service.py`)
- `create_subscription()` - Yeni abonelik başlatır
- `change_plan()` - Plan değişikliği (upgrade/downgrade)
- `cancel_subscription()` - Abonelik iptali
- `check_subscription_status()` - Detaylı durum kontrolü
- `process_trial_expirations()` - Trial süre dolma işlemi (cron)

**UsageService** (`app/services/usage_service.py`)
- `get_current_usage()` - Güncel kullanım
- `increment_usage()` - Kullanım artırma
- `check_usage_limit()` - Limit kontrolü
- `@require_usage_limit` - Decorator ile otomatik kontrol

**BillingService** (`app/services/billing_service.py`)
- `create_transaction()` - İşlem kaydı oluşturur
- `complete_transaction()` - Ödeme tamamlama
- `refund_transaction()` - İade işlemi
- `process_payment_webhook()` - Gateway webhook işleme

### Models

**Company** - Şirket/tenant bilgileri
**SubscriptionPlan** - Abonelik paketleri
**CompanySubscription** - Aktif abonelikler
**UsageTracking** - Kullanım takibi
**Transaction** - Ödeme kayıtları

### GraphQL API

**Queries:**
```graphql
query {
  myCompany {
    id
    companyCode
    name
    subdomain
    themeColors
  }
  
  subscriptionPlans {
    id
    name
    cvLimit
    monthlyPrice
  }
  
  mySubscription {
    status
    plan { name }
    nextBillingDate
  }
  
  subscriptionStatus {
    isActive
    isTrial
    limits { cvLimit jobLimit }
  }
  
  usageStats {
    cvUpload {
      currentUsage
      limit
      remaining
      percentageUsed
    }
  }
  
  myTransactions {
    invoiceNumber
    amount
    status
    transactionDate
  }
}
```

**Mutations:**
```graphql
mutation {
  login(input: {
    companyCode: "ABC123"
    email: "user@example.com"
    password: "password"
  }) {
    accessToken
    refreshToken
  }
  
  createCompany(input: {
    name: "My Company"
    subdomain: "mycompany"
    contactEmail: "info@mycompany.com"
  }) {
    id
    companyCode
  }
  
  changeSubscriptionPlan(input: {
    newPlanId: "plan-uuid"
    billingCycle: "yearly"
  }) {
    status
    nextBillingDate
  }
  
  cancelSubscription(immediate: false) {
    message
    success
  }
}
```

## Authentication Flow

### Login Değişikliği

**Öncesi:**
```graphql
mutation {
  login(input: { email: "user@example.com", password: "pass" })
}
```

**Sonrası:**
```graphql
mutation {
  login(input: { 
    companyCode: "ABC123"
    email: "user@example.com" 
    password: "pass" 
  })
}
```

### JWT Token Yapısı

Token artık `company_id` içerir:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "company_id": "company-uuid",
  "type": "access",
  "exp": 1234567890
}
```

### Middleware

**Company Context Extraction:**
```python
from app.api.dependencies import get_company_id, require_company_id

# Optional company_id
@app.get("/resource")
async def get_resource(company_id: Optional[UUID] = Depends(get_company_id)):
    ...

# Required company_id
@app.get("/resource")
async def get_resource(company_id: UUID = Depends(require_company_id)):
    ...
```

## Usage Limit Enforcement

### Decorator Kullanımı

```python
from app.services.usage_service import require_usage_limit
from app.models.subscription import ResourceType

@require_usage_limit(ResourceType.CV_UPLOAD)
async def upload_cv(db: AsyncSession, company_id: UUID, ...):
    # Otomatik limit kontrolü yapılır
    # Limit aşılmışsa 403 hatası döner
    # Başarılı işlem sonrası kullanım otomatik artırılır
    ...
```

### Manuel Kontrol

```python
from app.services.usage_service import UsageService

# Limit kontrolü
can_use = await UsageService.can_use_resource(
    db, company_id, ResourceType.CV_UPLOAD
)

if not can_use:
    raise HTTPException(status_code=403, detail="Limit reached")

# İşlemi yap
...

# Kullanımı artır
await UsageService.increment_usage(
    db, company_id, ResourceType.CV_UPLOAD
)
```

## Subscription Packages

### Starter Package (499 TRY/ay)
- 10 CV upload
- 5 job post
- 3 user accounts
- Temel özellikler

### Pro Package (999 TRY/ay)
- 100 CV upload
- 20 job posts
- 10 user accounts
- AI matching
- Advanced reports

### Business Package (2499 TRY/ay)
- 500 CV upload
- 50 job posts
- 25 user accounts
- Priority support
- API access

### Unlimited Package (White-label)
- Unlimited everything
- Custom domain
- Custom branding
- Dedicated support
- SLA guarantee

## Cron Jobs

Aşağıdaki işlemleri günlük olarak çalıştırın:

```python
# Trial süresi dolmuş abonelikleri güncelle
from app.services.subscription_service import SubscriptionService
expired_count = await SubscriptionService.process_trial_expirations(db)

# Yenileme tarihi gelmiş abonelikleri işle
renewal_count = await SubscriptionService.process_renewals(db)
```

## Frontend Integration

### Login Sayfası

```jsx
// Login formuna company code eklenmeli
<input 
  name="companyCode"
  placeholder="Şirket Kodu (örn: ABC123)"
  maxLength={6}
  style={{textTransform: 'uppercase'}}
  required
/>
```

### Usage Display Component

```jsx
function UsageIndicator() {
  const { data } = useQuery(USAGE_STATS_QUERY);
  
  return (
    <div>
      <ProgressBar 
        current={data.usageStats.cvUpload.currentUsage}
        limit={data.usageStats.cvUpload.limit}
        percentage={data.usageStats.cvUpload.percentageUsed}
      />
      <p>{data.usageStats.cvUpload.remaining} CV kaldı</p>
    </div>
  );
}
```

### Subscription Status Check

```jsx
const { data } = useQuery(SUBSCRIPTION_STATUS_QUERY);

if (!data.subscriptionStatus.isActive) {
  // Abonelik süresi dolmuş
  return <SubscriptionExpiredModal />;
}

if (data.subscriptionStatus.isTrial) {
  // Trial dönemde
  return <TrialBanner endDate={data.subscriptionStatus.trialEndDate} />;
}
```

## White-label Setup

### Domain Routing

```python
# Domain'e göre şirket bulma
company = await CompanyService.get_company_by_domain(db, request.host)

# Subdomain: mycompany.hrsmart.co
# Custom domain: jobs.mycompany.com
```

### Tema Renkleri

```jsx
// Şirket tema renklerini uygula
const { data } = useQuery(MY_COMPANY_QUERY);

document.documentElement.style.setProperty(
  '--primary-color', 
  data.myCompany.themeColors.primary
);
```

## Testing

### Migration Test

```bash
# Temiz veritabanı
dropdb test_cv_manager
createdb test_cv_manager

# Migration'ları çalıştır
for file in migrations/00{8..15}_*.sql; do
    psql -d test_cv_manager -f "$file"
done

# Verify
psql -d test_cv_manager -c "SELECT * FROM companies;"
psql -d test_cv_manager -c "SELECT * FROM subscription_plans;"
```

### Service Test

```python
import pytest
from app.services.company_service import CompanyService

async def test_create_company():
    company = await CompanyService.create_company(
        db, name="Test Company"
    )
    assert len(company.company_code) == 6
    assert company.is_active == True
```

## Troubleshooting

### Migration Hataları

**Problem:** `relation "companies" does not exist`
**Çözüm:** Migration 008'i çalıştırın

**Problem:** `enum type "subscription_status" does not exist`
**Çözüm:** Migration'ları sırayla çalıştırın

### Login Hataları

**Problem:** "Invalid company code"
**Çözüm:** Company code doğru formatta mı kontrol edin (3 harf + 3 rakam)

**Problem:** "Company context required"
**Çözüm:** JWT token'da company_id eksik, yeniden login yapın

### Usage Limit Hataları

**Problem:** Usage limit reached ama hala limit var
**Çözüm:** Kullanım tracking'i reset edin (admin)

```sql
-- Manuel reset
UPDATE usage_tracking 
SET count = 0 
WHERE company_id = 'company-uuid' 
AND resource_type = 'cv_upload'
AND period_start = DATE_TRUNC('month', CURRENT_DATE);
```

## Deployment Checklist

- [ ] Migration 008-015 çalıştırıldı
- [ ] Default company (SYS001) oluşturuldu
- [ ] 4 subscription plan seeded
- [ ] Mevcut veriler default company'ye atandı
- [ ] Backend servisleri deploy edildi
- [ ] GraphQL schema güncellemesi yapıldı
- [ ] Frontend login sayfası güncellendi
- [ ] JWT token yapısı güncellendi
- [ ] Cron jobs ayarlandı (trial expiry, renewals)
- [ ] Payment gateway entegrasyonu yapıldı (opsiyonel)
- [ ] White-label domain routing ayarlandı (opsiyonel)
- [ ] Monitoring ve alerting kuruldu

## Support

Sorular için:
- Backend: `/Back-end/README.md`
- Frontend: `/Front-end/README.md`
- Migrations: `/Back-end/migrations/README.md`
