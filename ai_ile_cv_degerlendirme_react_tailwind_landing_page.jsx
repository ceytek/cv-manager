import { useState } from "react";
import { Upload, FileSearch, LineChart, CheckCircle2, Briefcase, Sparkles, ArrowRight, BarChart3, ListChecks, ClipboardList, FileText, Settings2, Wand2, Globe } from "lucide-react";

/**
 * CV AI Değerlendirme – Tek Dosya React + Tailwind Landing Page
 * Çok dilli (TR/EN) destekli versiyon
 */

// ---- Basit i18n ----
const DICT = {
  tr: {
    brand: "CV Değerlendirme",
    aiBrand: "AI ile CV Değerlendirme",
    nav: {
      upload: "CV Upload",
      compare: "CV Karşılaştırma",
      analyze: "CV Analiz",
      results: "Analiz Sonuç",
      steps: "3 Adım",
      job: "İş İlanı",
      tryNow: "Hemen Dene",
    },
    hero: {
      title: "CV'leri dakikalar içinde analiz edin, en doğru adayı bulun.",
      desc:
        "Toplu CV yükleme, ilan eşleştirme, aday karşılaştırma ve detaylı uyumluluk skoru — hepsi tek ekranda.",
      watchDemo: "Demo'yu İzle",
      tryNow: "Hemen Dene",
      stat1: "Eşleşme Doğruluğu",
      stat2: "Analiz Süresi",
      stat3: "CV İşlendi",
    },
    steps: {
      kicker: "3 adımda CV Analiz",
      title: "Basit, hızlı ve doğru kararlar",
      desc: "Toplu CV yükleyin, ilana bağlayın ve sonuçları karşılaştırın.",
      s1: { title: "CV'leri Yükle", desc: "PDF/DOCX formatlarında tekli veya toplu yükleme yapın." },
      s2: { title: "İlanı Seç ve Eşleştir", desc: "Pozisyonu belirleyip adayları otomatik eşleştirin." },
      s3: { title: "Analizi İncele", desc: "Uyumluluk skoru, güçlü yönler ve eksikler tek ekranda." },
    },
    upload: {
      kicker: "CV Upload",
      title: "Toplu CV yükleme ile saniyeler içinde hazır",
      desc:
        "Sürükle-bırak ile birden fazla CV ekleyin, aday bilgileri otomatik çıkarılsın (iletişim, deneyim, diller, beceriler).",
      f1: { title: "PDF/DOC/DOCX desteği", desc: "Farklı dosya türlerini tek seferde içeri alın." },
      f2: { title: "Akıllı ayrıştırma", desc: "İletişim, eğitim, deneyim, beceri ve sertifikaları otomatik ayıklar." },
      f3: { title: "Dil tespiti", desc: "TR/EN CV'ler için otomatik dil algılama ve etiketleme." },
    },
    compare: {
      kicker: "CV Karşılaştırma",
      title: "Adayları yan yana görün",
      desc: "Eğitim, deneyim, dil ve beceriler bazında farkları vurgulayan net karşılaştırma.",
      f1: { title: "Öne çıkan farklar", desc: "Uzmanlık alanları ve güçlü yönleri vurgular." },
      f2: { title: "Uygun pozisyon önerisi", desc: "Deneyime göre uygun rol önerileri sunar." },
      f3: { title: "Skor bazlı sıralama", desc: "Karşılaştırırken genel uyumluluk skorunu kullanın." },
    },
    analyze: {
      kicker: "CV Analiz",
      title: "İlan bazlı uyumluluk analizi",
      desc:
        "İlan gereksinimleriyle aday niteliklerini eşleştirir; eksikler, güçlü yönler ve anahtar kelime uyumu raporlanır.",
      f1: { title: "Özet & İçgörü", desc: "LLM destekli kısa özet ve eyleme dönük çıkarımlar." },
      f2: { title: "Uyumluluk puanı", desc: "%0–100 arası skorlama, detayla birlikte sunulur." },
      f3: { title: "Anahtar kelime eşleşmesi", desc: "Jira, Agile, GraphQL gibi kritik terimleri yakalar." },
    },
    results: {
      kicker: "CV Analiz Sonuç",
      title: "Skor tablosu ile hızlı karar",
      desc: "Tüm adayları tek listede görün, filtreleyin ve detaylara tek tıkla inin.",
    },
    job: {
      kicker: "İş ilanı girme",
      title: "İş ilanlarınızı yönetin",
      desc: "Pozisyonları oluşturun, departman ve seviye belirleyin, aday analiziyle bağlayın.",
      f1: { title: "Hızlı ilan oluşturma", desc: "Başlık, seviye, lokasyon ve çalışma tipi alanları." },
      f2: { title: "İlan–Aday eşleştirme", desc: "Seçili ilana uygun adayları tek ekranda görürsünüz." },
      f3: { title: "Durum takibi", desc: "Aktif/Taslak/Kapalı/Arşiv filtreleri ile düzenli takip." },
    },
    cta: {
      title: "AI ile CV Değerlendirme'yi ücretsiz deneyin",
      desc:
        "API tabanlı mimari, kurumsal güvenlik ve hızlı kurulum. 14 gün ücretsiz deneme ile hemen başlayın.",
      start: "Başlayın",
      demo: "Canlı Demo İste",
    },
    footer: {
      privacy: "Gizlilik",
      terms: "Kullanım Şartları",
      contact: "İletişim",
      rights: (y) => `© ${y} CV Değerlendirme. Tüm hakları saklıdır.`,
    },
    langToggle: "TR",
  },
  en: {
    brand: "CV Evaluation",
    aiBrand: "AI-powered CV Evaluation",
    nav: {
      upload: "CV Upload",
      compare: "CV Compare",
      analyze: "CV Analysis",
      results: "Analysis Results",
      steps: "3 Steps",
      job: "Job Posting",
      tryNow: "Try Now",
    },
    hero: {
      title: "Analyze CVs in minutes and find the best-fit candidate.",
      desc:
        "Bulk CV upload, job matching, candidate comparison and detailed fit score — all in one place.",
      watchDemo: "Watch Demo",
      tryNow: "Try Now",
      stat1: "Match Accuracy",
      stat2: "Analysis Time",
      stat3: "CVs Processed",
    },
    steps: {
      kicker: "CV Analysis in 3 steps",
      title: "Simple, fast and accurate decisions",
      desc: "Upload CVs, link a job posting and compare results.",
      s1: { title: "Upload CVs", desc: "Upload single or bulk PDF/DOCX files." },
      s2: { title: "Select Job & Match", desc: "Pick the role and auto-match candidates." },
      s3: { title: "Review Insights", desc: "Fit score, strengths and gaps at a glance." },
    },
    upload: {
      kicker: "CV Upload",
      title: "Be ready in seconds with bulk uploads",
      desc:
        "Drag & drop multiple CVs and let the system extract contacts, experience, languages and skills.",
      f1: { title: "PDF/DOC/DOCX support", desc: "Import different file types at once." },
      f2: { title: "Smart parsing", desc: "Auto-extracts contact, education, experience, skills and certificates." },
      f3: { title: "Language detection", desc: "Auto-detects and tags TR/EN CVs." },
    },
    compare: {
      kicker: "CV Compare",
      title: "See candidates side by side",
      desc: "Clear comparison highlighting education, experience, languages and skills.",
      f1: { title: "Key differences", desc: "Surfaces expertise and strengths." },
      f2: { title: "Role suggestions", desc: "Suggests suitable roles based on background." },
      f3: { title: "Score-based ranking", desc: "Use the overall fit score while comparing." },
    },
    analyze: {
      kicker: "CV Analysis",
      title: "Job-based fit analysis",
      desc:
        "Matches job requirements with candidate qualifications and reports strengths, gaps and keyword alignment.",
      f1: { title: "Summary & Insight", desc: "LLM-powered short summary and actionable hints." },
      f2: { title: "Fit score", desc: "0–100 scoring with detailed breakdown." },
      f3: { title: "Keyword matching", desc: "Catches critical terms like Jira, Agile, GraphQL." },
    },
    results: {
      kicker: "Analysis Results",
      title: "Decide faster with the score table",
      desc: "View all candidates in one list, filter and drill down in one click.",
    },
    job: {
      kicker: "Job Posting",
      title: "Manage your job postings",
      desc: "Create positions, set departments & levels, and link with candidate analysis.",
      f1: { title: "Quick job creation", desc: "Title, level, location and work type fields." },
      f2: { title: "Job–Candidate matching", desc: "See candidates matching the selected job in one view." },
      f3: { title: "Status tracking", desc: "Track with Active/Draft/Closed/Archived filters." },
    },
    cta: {
      title: "Try AI-powered CV Evaluation for free",
      desc:
        "API-first architecture, enterprise security and quick setup. Start with a 14‑day free trial.",
      start: "Get Started",
      demo: "Request Live Demo",
    },
    footer: {
      privacy: "Privacy",
      terms: "Terms of Use",
      contact: "Contact",
      rights: (y) => `© ${y} CV Evaluation. All rights reserved.`,
    },
    langToggle: "EN",
  },
};

const useI18n = () => {
  const [lang, setLang] = useState("tr");
  const t = (path) => path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), DICT[lang]) ?? path;
  return { lang, setLang, t } as const;
};

// ---- Yardımcı UI ----
const Container = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const Section = ({ id, kicker, title, desc, children, className = "" }) => (
  <section id={id} className={`relative py-16 sm:py-20 ${className}`}>
    <Container>
      {kicker && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{kicker}</span>
        </div>
      )}
      {title && (
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{title}</h2>
      )}
      {desc && <p className="mt-3 max-w-3xl text-slate-600">{desc}</p>}
      {children && <div className="mt-8">{children}</div>}
    </Container>
    <div className="pointer-events-none absolute inset-x-0 -z-10 top-0 h-1/2 bg-gradient-to-b from-indigo-50/60 to-transparent" />
  </section>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white/80 shadow-sm backdrop-blur ${className}`}>{children}</div>
);

const Stat = ({ value, label }) => (
  <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-xs text-slate-500">{label}</div>
  </div>
);

const Feature = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10">
      <Icon className="h-5 w-5 text-indigo-600" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  </div>
);

const Step = ({ index, title, desc, icon: Icon }) => (
  <div className="group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10">
        <Icon className="h-4.5 w-4.5 text-indigo-600" />
      </div>
      <span className="text-xs font-semibold tracking-wide text-indigo-600">ADIM {index}</span>
    </div>
    <h4 className="mb-1 text-base font-semibold text-slate-900">{title}</h4>
    <p className="text-sm text-slate-600">{desc}</p>
  </div>
);

const Img = ({ src, alt }) => (
  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
    <img src={src} alt={alt} className="h-full w-full object-cover" />
  </div>
);

// ---- NAVBAR ----
const Navbar = ({ t, lang, setLang }) => {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#upload", label: t("nav.upload") },
    { href: "#compare", label: t("nav.compare") },
    { href: "#analyze", label: t("nav.analyze") },
    { href: "#results", label: t("nav.results") },
    { href: "#steps", label: t("nav.steps") },
    { href: "#job", label: t("nav.job") },
  ];
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">AI</div>
          <span>{t("brand")}</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-slate-900">
              {l.label}
            </a>
          ))}
          <button
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            aria-label="Language toggle"
          >
            <Globe className="h-4 w-4" /> {lang.toUpperCase()}
          </button>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            {t("nav.tryNow")} <ArrowRight className="h-4 w-4" />
          </a>
        </nav>

        <button onClick={() => setOpen((s) => !s)} className="md:hidden">
          <span className="sr-only">Menu</span>
          <Settings2 className="h-6 w-6" />
        </button>
      </Container>
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <Container className="flex flex-col gap-3 py-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-slate-700">
                {l.label}
              </a>
            ))}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang(lang === "tr" ? "en" : "tr")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                <Globe className="h-4 w-4" /> {lang.toUpperCase()}
              </button>
              <a href="#cta" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                {t("nav.tryNow")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
};

// ---- Ana Sayfa ----
export default function LandingPage() {
  const { lang, setLang, t } = useI18n();

  return (
    <div id="top" className="min-h-screen scroll-smooth bg-slate-50">
      <Navbar t={t} lang={lang} setLang={setLang} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Wand2 className="h-3.5 w-3.5" /> {t("aiBrand")}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">{t("hero.title")}</h1>
            <p className="mt-4 max-w-xl text-slate-600">{t("hero.desc")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#upload" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow">
                {t("hero.watchDemo")}
              </a>
              <a href="#cta" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t("hero.tryNow")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              <Stat value="%90+" label={t("hero.stat1")} />
              <Stat value="3 dk" label={t("hero.stat2")} />
              <Stat value=">5K" label={t("hero.stat3")} />
            </div>
          </div>
          <div>
            <Img src="/images/hero_placeholder.png" alt="AI CV UI" />
          </div>
        </Container>
        <div className="pointer-events-none absolute inset-x-0 -bottom-16 h-32 bg-gradient-to-t from-indigo-100/40 to-transparent" />
      </section>

      {/* 3 ADIM */}
      <Section id="steps" kicker={t("steps.kicker")} title={t("steps.title")} desc={t("steps.desc")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step index={1} title={t("steps.s1.title")} desc={t("steps.s1.desc")} icon={Upload} />
          <Step index={2} title={t("steps.s2.title")} desc={t("steps.s2.desc")} icon={Briefcase} />
          <Step index={3} title={t("steps.s3.title")} desc={t("steps.s3.desc")} icon={BarChart3} />
        </div>
      </Section>

      {/* CV UPLOAD */}
      <Section id="upload" kicker={t("upload.kicker")} title={t("upload.title")} desc={t("upload.desc")}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <Feature icon={Upload} title={t("upload.f1.title")} desc={t("upload.f1.desc")} />
            <Feature icon={FileSearch} title={t("upload.f2.title")} desc={t("upload.f2.desc")} />
            <Feature icon={CheckCircle2} title={t("upload.f3.title")} desc={t("upload.f3.desc")} />
          </div>
          <Card className="p-4">
            <Img src="/images/cv_upload.png" alt="CV Upload" />
          </Card>
        </div>
      </Section>

      {/* KARŞILAŞTIRMA */}
      <Section id="compare" kicker={t("compare.kicker")} title={t("compare.title")} desc={t("compare.desc")}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Card className="p-4">
            <Img src="/images/cv_compare.png" alt="CV Compare" />
          </Card>
          <div className="space-y-5">
            <Feature icon={ListChecks} title={t("compare.f1.title")} desc={t("compare.f1.desc")} />
            <Feature icon={ClipboardList} title={t("compare.f2.title")} desc={t("compare.f2.desc")} />
            <Feature icon={LineChart} title={t("compare.f3.title")} desc={t("compare.f3.desc")} />
          </div>
        </div>
      </Section>

      {/* ANALİZ */}
      <Section id="analyze" kicker={t("analyze.kicker")} title={t("analyze.title")} desc={t("analyze.desc")}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-5">
            <Feature icon={FileText} title={t("analyze.f1.title")} desc={t("analyze.f1.desc")} />
            <Feature icon={BarChart3} title={t("analyze.f2.title")} desc={t("analyze.f2.desc")} />
            <Feature icon={Sparkles} title={t("analyze.f3.title")} desc={t("analyze.f3.desc")} />
          </div>
          <Card className="p-4">
            <Img src="/images/cv_analyze.png" alt="CV Analyze" />
          </Card>
        </div>
      </Section>

      {/* SONUÇLAR */}
      <Section id="results" kicker={t("results.kicker")} title={t("results.title")} desc={t("results.desc")}>
        <Card className="p-4">
          <Img src="/images/cv_results.png" alt="CV Results" />
        </Card>
      </Section>

      {/* İŞ İLANI */}
      <Section id="job" kicker={t("job.kicker")} title={t("job.title")} desc={t("job.desc")}>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Card className="p-4">
            <Img src="/images/job_post.png" alt="Job Post" />
          </Card>
          <div className="space-y-5">
            <Feature icon={Briefcase} title={t("job.f1.title")} desc={t("job.f1.desc")} />
            <Feature icon={FileSearch} title={t("job.f2.title")} desc={t("job.f2.desc")} />
            <Feature icon={CheckCircle2} title={t("job.f3.title")} desc={t("job.f3.desc")} />
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section id="cta" className="relative overflow-hidden py-16">
        <Container>
          <Card className="relative overflow-hidden px-6 py-10 text-center sm:px-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("cta.title")}</h3>
            <p className="mx-auto mt-2 max-w-2xl text-slate-600">{t("cta.desc")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#upload" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow">
                {t("cta.start")}
              </a>
              <a href="#" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t("cta.demo")}
              </a>
            </div>
          </Card>
        </Container>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">{DICT["tr"].footer.rights(new Date().getFullYear()) && DICT[lang].footer.rights(new Date().getFullYear())}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-slate-700">{t("footer.terms")}</a>
            <a href="#" className="hover:text-slate-700">{t("footer.contact")}</a>
          </div>
        </Container>
      </footer>
    </div>
  );
}
