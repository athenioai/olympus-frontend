"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Building2,
  MapPin,
  FileText,
  Sparkles,
  Globe,
  Map,
  Plus,
  Trash2,
  Loader2,
  Trophy,
  Star,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isValidCNPJ } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  fetchBusinessProfile,
  saveBusinessProfile,
  saveBusinessAddress,
  removeBusinessAddress,
  addBusinessSocialLink,
  removeBusinessSocialLink,
  addBusinessServiceArea,
  removeBusinessServiceArea,
} from "../business-profile-actions";
import type {
  BusinessProfileView,
  ScoreTier,
  ServiceModality,
  SocialPlatform,
  BusinessSocialLink,
  BusinessServiceArea,
} from "@/lib/services";

// ---------------------------------------------------------------------------
// Tier config
// ---------------------------------------------------------------------------

const TIER_CONFIG: Record<ScoreTier, { icon: string; color: string; bg: string; label: string; next?: ScoreTier }> = {
  none: { icon: "⚠️", color: "text-on-surface-variant", bg: "bg-surface-container-high", label: "Comece a preencher", next: "bronze" },
  bronze: { icon: "🥉", color: "text-[#CD7F32]", bg: "bg-[#CD7F32]/10", label: "Agente básico", next: "silver" },
  silver: { icon: "🥈", color: "text-[#C0C0C0]", bg: "bg-[#C0C0C0]/10", label: "Agente experiente", next: "gold" },
  gold: { icon: "🥇", color: "text-[#FFD700]", bg: "bg-[#FFD700]/10", label: "Agente especialista", next: "diamond" },
  diamond: { icon: "💎", color: "text-[#b9f2ff]", bg: "bg-[#b9f2ff]/10", label: "Agente perfeito" },
};

const TIER_THRESHOLDS: Record<ScoreTier, number> = {
  none: 0, bronze: 30, silver: 51, gold: 71, diamond: 91,
};

const MODALITIES: ServiceModality[] = ["presencial", "remoto", "domicilio", "hibrido"];

const ALL_PLATFORMS: SocialPlatform[] = ["website", "instagram", "google_reviews", "facebook", "linkedin", "youtube", "tiktok"];
const SCORABLE_PLATFORMS: SocialPlatform[] = ["website", "instagram", "google_reviews"];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  website: "Website", instagram: "Instagram", google_reviews: "Google Reviews",
  facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok",
};

// ---------------------------------------------------------------------------
// CNPJ mask
// ---------------------------------------------------------------------------

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Score card
// ---------------------------------------------------------------------------

function ScoreCard({ score, t }: {
  readonly score: BusinessProfileView["score"];
  readonly t: ReturnType<typeof useTranslations>;
}) {
  const tier = TIER_CONFIG[score.tier];
  const nextTier = tier.next ? TIER_CONFIG[tier.next] : null;
  const nextThreshold = tier.next ? TIER_THRESHOLDS[tier.next] : 100;
  const pointsToNext = nextTier ? Math.max(0, Math.ceil((nextThreshold / 100) * score.maxScore) - score.score) : 0;

  return (
    <motion.div className="grid grid-cols-1 gap-5 lg:grid-cols-12" variants={fadeInUp}>
      {/* Score summary */}
      <div className="rounded-xl bg-surface-container-low p-6 lg:col-span-8">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: `${tier.bg.replace("bg-", "")}` }}>
            <span className={cn("text-3xl", tier.bg.includes("[") ? "" : "")}>{tier.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-on-surface">{t("profile.score.title")}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", tier.bg, tier.color)}>
                {tier.label}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-on-surface-variant">
                  {score.score} / {score.maxScore} {t("profile.score.points")}
                </span>
                <span className="font-bold text-on-surface">{score.percentage}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <motion.div
                  animate={{ width: `${score.percentage}%` }}
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
              </div>
            </div>
            {nextTier && pointsToNext > 0 && (
              <p className="mt-2 text-[12px] text-on-surface-variant">
                {t("profile.score.nextTier", { points: pointsToNext, tier: nextTier.label })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className={cn(
        "flex flex-col justify-between rounded-xl p-6 lg:col-span-4",
        score.canConnectChannel ? "bg-success/8" : "bg-danger/6",
      )}>
        <div className="flex items-center gap-3">
          {score.canConnectChannel ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-danger" />
          )}
          <p className={cn("text-[13px] font-semibold leading-snug", score.canConnectChannel ? "text-success" : "text-danger")}>
            {score.canConnectChannel
              ? t("profile.score.canConnect")
              : score.missingRequired.length > 0
                ? t("profile.score.missingFields", { count: score.missingRequired.length })
                : t("profile.score.nextTier", { points: Math.ceil(0.3 * score.maxScore) - score.score, tier: "Bronze" })
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BusinessProfileSettings() {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [profileView, setProfileView] = useState<BusinessProfileView | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [serviceModality, setServiceModality] = useState<ServiceModality>("presencial");
  const [paymentPolicy, setPaymentPolicy] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [differentials, setDifferentials] = useState("");
  const [escalationRules, setEscalationRules] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [legalName, setLegalName] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  // Address
  const [showAddress, setShowAddress] = useState(false);
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Social links & areas from server
  const [socialLinks, setSocialLinks] = useState<BusinessSocialLink[]>([]);
  const [serviceAreas, setServiceAreas] = useState<BusinessServiceArea[]>([]);

  // Social link form
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("website");
  const [newUrl, setNewUrl] = useState("");

  // Service area form
  const [newArea, setNewArea] = useState("");

  const loadProfile = useCallback(async () => {
    const result = await fetchBusinessProfile();
    if (result.success && result.data) {
      const pv = result.data;
      setProfileView(pv);

      if (pv.profile) {
        setBusinessName(pv.profile.businessName ?? "");
        setBusinessDescription(pv.profile.businessDescription ?? "");
        setServiceModality(pv.profile.serviceModality ?? "presencial");
        setPaymentPolicy(pv.profile.paymentPolicy ?? "");
        setCancellationPolicy(pv.profile.cancellationPolicy ?? "");
        setDifferentials(pv.profile.differentials ?? "");
        setEscalationRules(pv.profile.escalationRules ?? "");
        setCnpj(pv.profile.cnpj ? maskCnpj(pv.profile.cnpj) : "");
        setLegalName(pv.profile.legalName ?? "");
        setFoundedYear(pv.profile.foundedYear ? String(pv.profile.foundedYear) : "");
      }

      if (pv.address) {
        setShowAddress(true);
        setStreet(pv.address.street ?? "");
        setNeighborhood(pv.address.neighborhood ?? "");
        setCity(pv.address.city ?? "");
        setState(pv.address.state ?? "");
      }

      setSocialLinks([...pv.socialLinks]);
      setServiceAreas([...pv.serviceAreas]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  function handleSave() {
    const trimmedName = businessName.trim();
    const trimmedDescription = businessDescription.trim();
    const trimmedPayment = paymentPolicy.trim();
    const trimmedCancellation = cancellationPolicy.trim();
    const trimmedDifferentials = differentials.trim();
    const trimmedEscalation = escalationRules.trim();
    const trimmedLegalName = legalName.trim();
    const cnpjDigits = cnpj.replace(/\D/g, "");

    const missing: string[] = [];
    if (!trimmedName) missing.push(t("profile.fields.businessName"));
    if (!trimmedDescription) missing.push(t("profile.fields.businessDescription"));
    if (!trimmedPayment) missing.push(t("profile.fields.paymentPolicy"));
    if (!trimmedCancellation) missing.push(t("profile.fields.cancellationPolicy"));
    if (missing.length > 0) {
      toast.error(t("profile.errors.missingRequired", { fields: missing.join(", ") }));
      return;
    }

    if (cnpjDigits && !isValidCNPJ(cnpjDigits)) {
      toast.error(t("profile.errors.cnpjInvalid"));
      return;
    }

    const parsedYear = foundedYear ? Number(foundedYear) : null;
    if (parsedYear !== null && (!Number.isFinite(parsedYear) || parsedYear < 1800 || parsedYear > new Date().getFullYear())) {
      toast.error(t("profile.errors.foundedYearInvalid"));
      return;
    }

    startTransition(async () => {
      const profileResult = await saveBusinessProfile({
        businessName: trimmedName,
        businessDescription: trimmedDescription,
        serviceModality,
        paymentPolicy: trimmedPayment,
        cancellationPolicy: trimmedCancellation,
        differentials: trimmedDifferentials || null,
        escalationRules: trimmedEscalation || null,
        cnpj: cnpjDigits || null,
        legalName: trimmedLegalName || null,
        foundedYear: parsedYear,
      });

      if (!profileResult.success) {
        toast.error(profileResult.error ?? "Erro ao salvar");
        return;
      }

      if (showAddress && street.trim()) {
        const addrResult = await saveBusinessAddress({
          street: street.trim(),
          neighborhood: neighborhood.trim() || null,
          city: city.trim(),
          state: state.trim().toUpperCase(),
        });
        if (!addrResult.success) {
          toast.error(addrResult.error ?? "Erro ao salvar endereço");
          return;
        }
      }

      toast.success(t("saved"));
      loadProfile();
    });
  }

  function handleAddSocial() {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      toast.error(t("profile.errors.socialUrlInvalid"));
      return;
    }
    startTransition(async () => {
      const result = await addBusinessSocialLink({ platform: newPlatform, url: trimmed });
      if (result.success && result.data) {
        setSocialLinks((prev) => [...prev, result.data!]);
        setNewUrl("");
        toast.success(t("saved"));
      } else {
        toast.error(result.error === "CONFLICT" ? "Plataforma já cadastrada" : result.error ?? "Erro");
      }
    });
  }

  function handleRemoveSocial(platform: SocialPlatform) {
    startTransition(async () => {
      const result = await removeBusinessSocialLink(platform);
      if (result.success) {
        setSocialLinks((prev) => prev.filter((l) => l.platform !== platform));
      }
    });
  }

  function handleAddArea() {
    if (!newArea.trim()) return;
    startTransition(async () => {
      const result = await addBusinessServiceArea({ name: newArea.trim() });
      if (result.success && result.data) {
        setServiceAreas((prev) => [...prev, result.data!]);
        setNewArea("");
        toast.success(t("saved"));
      } else {
        toast.error(result.error === "CONFLICT" ? "Área já cadastrada" : result.error ?? "Erro");
      }
    });
  }

  function handleRemoveArea(id: string) {
    startTransition(async () => {
      const result = await removeBusinessServiceArea(id);
      if (result.success) {
        setServiceAreas((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function handleRemoveAddr() {
    startTransition(async () => {
      const result = await removeBusinessAddress();
      if (result.success) {
        setShowAddress(false);
        setStreet(""); setNeighborhood(""); setCity(""); setState("");
        toast.success("Endereço removido");
        loadProfile();
      }
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant/40" />
      </div>
    );
  }

  const score = profileView?.score ?? { score: 0, maxScore: 218, percentage: 0, tier: "none" as ScoreTier, missingRequired: [], canConnectChannel: false };
  const missingSet = new Set(score.missingRequired);

  const inputCls = "w-full rounded-xl bg-surface-container-high border-none px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20";
  const textareaCls = `${inputCls} min-h-[100px] resize-none`;
  const labelCls = "text-[12px] font-semibold text-on-surface-variant";
  const sectionCls = "space-y-4 rounded-xl bg-surface-container-low/40 p-6";

  function RequiredBadge({ field }: { readonly field: string }) {
    const isMissing = missingSet.has(field);
    return (
      <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", isMissing ? "bg-danger/10 text-danger" : "bg-primary/8 text-primary")}>
        {t("profile.required")}
      </span>
    );
  }

  return (
    <motion.div animate="visible" className="space-y-10" initial="hidden" variants={staggerContainer}>
      {/* Hero */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-on-surface">
          {t("profile.title")}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-on-surface-variant">
          {t("profile.subtitle")}
        </p>
      </motion.div>

      {/* Score */}
      <ScoreCard score={score} t={t} />

      {/* 1. Required fields */}
      <motion.section className={sectionCls} variants={fadeInUp}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.required")}</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant">{t("profile.sections.requiredDesc")}</p>

        <div className="space-y-4 pt-2">
          <div>
            <label className={labelCls}>{t("profile.fields.businessName")} <RequiredBadge field="businessName" /></label>
            <input className={inputCls} maxLength={120} onChange={(e) => setBusinessName(e.target.value)} placeholder={t("profile.fields.businessNamePlaceholder")} value={businessName} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.businessDescription")} <RequiredBadge field="businessDescription" /></label>
            <textarea className={textareaCls} maxLength={2000} onChange={(e) => setBusinessDescription(e.target.value)} placeholder={t("profile.fields.businessDescriptionPlaceholder")} value={businessDescription} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.serviceModality")} <RequiredBadge field="serviceModality" /></label>
            <select className={inputCls} onChange={(e) => setServiceModality(e.target.value as ServiceModality)} value={serviceModality}>
              {MODALITIES.map((m) => (
                <option key={m} value={m}>{t(`profile.fields.modalities.${m}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.paymentPolicy")} <RequiredBadge field="paymentPolicy" /></label>
            <textarea className={textareaCls} maxLength={2000} onChange={(e) => setPaymentPolicy(e.target.value)} placeholder={t("profile.fields.paymentPolicyPlaceholder")} value={paymentPolicy} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.cancellationPolicy")} <RequiredBadge field="cancellationPolicy" /></label>
            <textarea className={textareaCls} maxLength={2000} onChange={(e) => setCancellationPolicy(e.target.value)} placeholder={t("profile.fields.cancellationPolicyPlaceholder")} value={cancellationPolicy} />
          </div>
        </div>
      </motion.section>

      {/* 2. Address */}
      <motion.section className={sectionCls} variants={fadeInUp}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.address")}</h3>
          </div>
          {showAddress ? (
            <button className="text-[12px] font-semibold text-danger transition-colors hover:text-danger/80" onClick={handleRemoveAddr} type="button">
              {t("profile.sections.removeAddress")}
            </button>
          ) : (
            <button className="flex items-center gap-1 text-[12px] font-semibold text-primary" onClick={() => setShowAddress(true)} type="button">
              <Plus className="h-3.5 w-3.5" /> {t("profile.sections.addAddress")}
            </button>
          )}
        </div>
        {showAddress && (
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t("profile.fields.street")}</label>
              <input className={inputCls} onChange={(e) => setStreet(e.target.value)} value={street} />
            </div>
            <div>
              <label className={labelCls}>{t("profile.fields.neighborhood")}</label>
              <input className={inputCls} onChange={(e) => setNeighborhood(e.target.value)} value={neighborhood} />
            </div>
            <div>
              <label className={labelCls}>{t("profile.fields.city")}</label>
              <input className={inputCls} onChange={(e) => setCity(e.target.value)} value={city} />
            </div>
            <div>
              <label className={labelCls}>{t("profile.fields.state")}</label>
              <input className={inputCls} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="SP" value={state} />
            </div>
          </div>
        )}
      </motion.section>

      {/* 3. Legal */}
      <motion.section className={sectionCls} variants={fadeInUp}>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.legal")}</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant">{t("profile.sections.legalDesc")}</p>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
          <div>
            <label className={labelCls}>{t("profile.fields.cnpj")}</label>
            <input className={inputCls} onChange={(e) => setCnpj(maskCnpj(e.target.value))} placeholder={t("profile.fields.cnpjPlaceholder")} value={cnpj} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.legalName")}</label>
            <input className={inputCls} maxLength={200} onChange={(e) => setLegalName(e.target.value)} placeholder={t("profile.fields.legalNamePlaceholder")} value={legalName} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.foundedYear")}</label>
            <input className={inputCls} max={new Date().getFullYear()} min={1900} onChange={(e) => setFoundedYear(e.target.value)} type="number" value={foundedYear} />
          </div>
        </div>
      </motion.section>

      {/* 4. Extras */}
      <motion.section className={sectionCls} variants={fadeInUp}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.extras")}</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant">{t("profile.sections.extrasDesc")}</p>
        <div className="space-y-4 pt-2">
          <div>
            <label className={labelCls}>{t("profile.fields.differentials")}</label>
            <textarea className={textareaCls} maxLength={2000} onChange={(e) => setDifferentials(e.target.value)} placeholder={t("profile.fields.differentialsPlaceholder")} value={differentials} />
          </div>
          <div>
            <label className={labelCls}>{t("profile.fields.escalationRules")}</label>
            <textarea className={textareaCls} maxLength={2000} onChange={(e) => setEscalationRules(e.target.value)} placeholder={t("profile.fields.escalationRulesPlaceholder")} value={escalationRules} />
          </div>
        </div>
      </motion.section>

      {/* 5. Social links */}
      <motion.section className={sectionCls} variants={fadeInUp}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.social")}</h3>
        </div>
        <p className="text-[13px] text-on-surface-variant">{t("profile.sections.socialDesc")}</p>

        {socialLinks.length > 0 && (
          <div className="space-y-2 pt-2">
            {socialLinks.map((link) => (
              <div className="flex items-center gap-3 rounded-lg border border-surface-container-high bg-surface-container-lowest/50 px-4 py-2.5" key={link.id}>
                <span className="text-[13px] font-semibold text-on-surface">
                  {PLATFORM_LABELS[link.platform]}
                  {SCORABLE_PLATFORMS.includes(link.platform) && <Star className="ml-1 inline h-3 w-3 text-primary" />}
                </span>
                <span className="flex-1 truncate text-[12px] text-on-surface-variant">{link.url}</span>
                <button className="text-on-surface-variant/40 transition-colors hover:text-danger" disabled={isPending} onClick={() => handleRemoveSocial(link.platform)} type="button">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 pt-2">
          <div className="flex-shrink-0">
            <label className={labelCls}>{t("profile.fields.platform")}</label>
            <select className={`${inputCls} w-40`} onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)} value={newPlatform}>
              {ALL_PLATFORMS.filter((p) => !socialLinks.some((l) => l.platform === p)).map((p) => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelCls}>{t("profile.fields.url")}</label>
            <input className={inputCls} onChange={(e) => setNewUrl(e.target.value)} placeholder={t("profile.fields.urlPlaceholder")} value={newUrl} />
          </div>
          <button className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40" disabled={isPending || !newUrl.trim()} onClick={handleAddSocial} type="button">
            <Plus className="h-4 w-4" /> {t("profile.sections.addSocial")}
          </button>
        </div>
      </motion.section>

      {/* 6. Service areas */}
      {serviceModality !== "presencial" && (
        <motion.section className={sectionCls} variants={fadeInUp}>
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-bold tracking-tight text-on-surface">{t("profile.sections.areas")}</h3>
          </div>
          <p className="text-[13px] text-on-surface-variant">{t("profile.sections.areasDesc")}</p>

          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {serviceAreas.map((area) => (
                <div className="flex items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-lowest/50 px-3 py-1.5" key={area.id}>
                  <span className="text-[13px] font-medium text-on-surface">{area.name}</span>
                  <button className="text-on-surface-variant/40 transition-colors hover:text-danger" disabled={isPending} onClick={() => handleRemoveArea(area.id)} type="button">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 pt-2">
            <div className="flex-1">
              <label className={labelCls}>{t("profile.fields.areaName")}</label>
              <input className={inputCls} onChange={(e) => setNewArea(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddArea(); } }} placeholder={t("profile.fields.areaNamePlaceholder")} value={newArea} />
            </div>
            <button className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40" disabled={isPending || !newArea.trim()} onClick={handleAddArea} type="button">
              <Plus className="h-4 w-4" /> {t("profile.sections.addArea")}
            </button>
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <motion.div className="flex items-center justify-between border-t border-on-surface-variant/10 pt-8" variants={fadeInUp}>
        <div className="flex items-center gap-2 text-on-surface-variant/40">
          <span className="text-[10px] font-bold uppercase tracking-widest">
            🏢 {t("profile.title")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-xl px-8 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high" disabled={isPending} onClick={loadProfile} type="button">
            {t("profile.discard")}
          </button>
          <button className="rounded-xl bg-primary px-10 py-3 font-display text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60" disabled={isPending} onClick={handleSave} type="button">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("profile.save")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
