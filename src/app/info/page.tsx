"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/dev/button";
import { getPagesConfig, getSiteConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";
import EditableImage from "@/components/admin/editable-image";
import { useCustomization } from "@/context/CustomizationContext";


/* =========================
   Reusable UI bits
   ========================= */

type WithChildren = {
  children: React.ReactNode;
  className?: string;
};

function Pill({ children, className = "" }: WithChildren) {
  return (
    <span
      className={[
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        "bg-slate-50 text-slate-700 border border-slate-200",
        "shadow-[0_0_0_6px_rgba(15,23,42,0.02)]",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  className = "",
}: {
  icon: React.ComponentType<any>;
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "group relative rounded-2xl border bg-white/90 shadow-sm p-6 text-center overflow-hidden",
        "flex flex-col items-center justify-center",
        "transition-all duration-300 hover:shadow-md hover:-translate-y-1",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-1 h-0.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 opacity-70" />
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 mb-3 ring-1 ring-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}

function TimelineItem({
  title,
  subtitle,
  right,
  last,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="grid grid-cols-[28px,1fr,auto] gap-4 group">
      <div className="flex flex-col items-center">
        <span className="relative z-10 mt-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 shadow-[0_0_0_3px_#fff] group-hover:scale-110 transition-transform" />
        {!last && <span className="flex-1 w-[2px] bg-slate-200 mt-1 mb-1" />}
      </div>

      <div className="pb-6">
        <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>
        )}
      </div>

      <div className="text-xs text-slate-500 pt-1">{right}</div>
    </div>
  );
}

/* Generic section + card wrappers */

function Section({
  children,
  className = "",
  maxClass = "max-w-7xl",
}: WithChildren & { maxClass?: string }) {
  return (
    <section className={`${maxClass} mx-auto px-4 md:px-6 ${className}`}>
      {children}
    </section>
  );
}

function CardSection({ children, className = "" }: WithChildren) {
  return (
    <div
      className={[
        "rounded-3xl border bg-white/90 shadow-sm p-6 md:p-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  id,
}: {
  icon?: React.ComponentType<any>;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2 mb-4 md:mb-6" {...(id ? { id } : {})}>
      {eyebrow && (
        <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-500">
          {eyebrow}
        </div>
      )}
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          {title}
        </h2>
      </div>
      {description && (
        <div className="text-sm md:text-base text-slate-600 max-w-2xl">
          {description}
        </div>
      )}
    </div>
  );
}

/* =========================
   Hero Heading
   ========================= */

function HeroHeading({ pagesConfig }: { pagesConfig: any }) {
  const { heading, subHeading, label } = pagesConfig.about.hero;
  
  const namePart = pagesConfig.about.teacher.name;
  const prefix = heading.replace(namePart, "").trim();

  return (
    <header aria-label="Introduction" className="space-y-3">
      <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">{label}</p>

      <div className="text-[44px] md:text-[52px] leading-[1.05] font-extrabold tracking-tight text-slate-900">
        <EditableContent
          configKey="pages.about.hero.heading"
          initialValue={heading}
          as="span"
        />
      </div>

      <EditableContent
        configKey="pages.about.hero.subHeading"
        initialValue={subHeading}
        as="p"
        className="text-sm md:text-base text-slate-600 max-w-xl"
      />
    </header>
  );
}

/* =========================
   Page
   ========================= */

export default function AboutPortfolioPage() {
  const { siteSettings, pagesSettings, subjects, grades } = useCustomization();
  const pagesConfig = useMemo(() => getPagesConfig({ site: siteSettings, pages: pagesSettings, subjects, grades }), [siteSettings, pagesSettings, subjects, grades]);

  const { teacher: person, hero, results, quote, education, features, stats } = pagesConfig.about;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    alternateName: person.alternateName,
    jobTitle: person.role,
    url: pagesConfig.about.metadata.url,
    image: pagesConfig.about.metadata.ogImage,
    affiliation: {
      "@type": "Organization",
      name: "NexvoLearn",
      url: "https://www.nexvolearn.com",
    },
    sameAs: person.socials.map((s: any) => s.url),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <main className="relative min-h-screen bg-slate-50 pb-16 md:pb-20 overflow-x-hidden">
        {/* Background accents pinned to viewport (no extra scroll height) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-72 w-[120vw] rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(closest-side, rgba(129,140,248,.18), rgba(217,70,239,.12), rgba(56,189,248,.10), transparent 80%)",
            }}
          />
          <div
            className="absolute -bottom-40 right-0 h-72 w-[120vw] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(closest-side, rgba(56,189,248,.10), rgba(217,70,239,.10), rgba(129,140,248,.12), transparent 80%)",
            }}
          />
        </div>

        <div className="space-y-16 md:space-y-20 pt-10 md:pt-16">
          {/* ===== RESULTS FIRST: HEADING ===== */}
          {/* ===== RESULTS SECTION GROUP ===== */}
          <div className="space-y-6">
            <Section>
              <SectionHeading
                icon={results.icon}
                eyebrow={
                  <EditableContent
                    configKey="pages.about.results.eyebrow"
                    initialValue={results.eyebrow}
                  />
                }
                title={
                  <EditableContent
                    configKey="pages.about.results.heading"
                    initialValue={results.heading}
                  />
                }
              />
            </Section>

            <Section maxClass="max-w-full" className="px-0">
              <CardSection className="rounded-none border-0 shadow-none p-0 max-w-full mx-0">
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <EditableImage
                      configKey="pages.about.results.image"
                      initialValue={results.image}
                      alt={results.description}
                      fill
                      className="object-cover object-center"
                      sizes="100vw"
                      aspectRatio={16 / 9}
                    />
                  </div>

                  <div className="mt-6 text-center text-sm text-slate-500 max-w-xl px-4">
                    <EditableContent
                      configKey="pages.about.results.description"
                      initialValue={results.description}
                    />
                  </div>
                </div>
              </CardSection>
            </Section>
          </div>

          {/* ===== MAIN HEADING FOR TEACHER ===== */}
          {/* ===== TEACHER SECTION GROUP ===== */}
          <div className="space-y-8">
            <Section>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 text-center">
                <EditableContent
                  configKey="pages.about.teacher.sectionHeading"
                  initialValue={person.sectionHeading}
                />
              </h2>
            </Section>

            <Section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
                {/* Photo */}
                <div className="relative order-2 md:order-1">
                  <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-sky-200 opacity-70 blur-xl" />
                  <div className="relative h-[460px] md:h-[520px] rounded-[28px] overflow-hidden border bg-white shadow-xl">
                    <EditableImage
                      configKey="pages.about.teacher.image"
                      initialValue={person.image}
                      alt={person.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      aspectRatio={3 / 4}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {person.pills.map((pill: any, i: number) => (
                      <Pill key={i}>{pill}</Pill>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-4 order-1 md:order-2">
                  <HeroHeading pagesConfig={pagesConfig} />

                  <div className="text-lg text-slate-600 max-w-xl">
                    <EditableContent
                      configKey="pages.about.hero.introduction"
                      initialValue={hero.introduction}
                    />
                  </div>
                  {hero.bio.map((paragraph: any, i: number) => (
                    <div
                      key={i}
                      className="text-[15px] md:text-[17px] text-slate-700 leading-relaxed max-w-xl"
                    >
                      <EditableContent
                        configKey={`pages.about.hero.bio.${i}`}
                        initialValue={paragraph}
                      />
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center gap-3">
                    {hero.actions.map((action: any, i: number) => (
                      <Button
                        key={i}
                        variant={action.primary ? "default" : "outline"}
                        className={
                          action.primary
                            ? "rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                            : "rounded-xl border-slate-200 hover:bg-slate-50"
                        }
                        asChild
                      >
                        <a href={action.href} target={action.href.startsWith("http") ? "_blank" : undefined} rel={action.href.startsWith("http") ? "noreferrer" : undefined}>
                          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                          <EditableContent
                            configKey={`pages.about.hero.actions.${i}.label`}
                            initialValue={action.label}
                            as="span"
                          />
                        </a>
                      </Button>
                    ))}

                    <nav
                      className="ml-auto flex items-center gap-2"
                      aria-label="Social links"
                    >
                      {person.socials.map((social: any, i: number) => (
                        <a
                          key={i}
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                          aria-label={social.name}
                        >
                          <social.icon className="w-4 h-4" />
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* ===== QUOTE / BRAND MESSAGE ===== */}
          <Section maxClass="max-w-5xl">
            <CardSection>
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                <div className="shrink-0 rounded-xl bg-emerald-50 text-emerald-600 p-3 ring-1 ring-emerald-100">
                  <quote.icon className="w-6 h-6" />
                </div>
                <blockquote className="text-lg md:text-2xl text-slate-700 leading-relaxed">
                  <span className="font-semibold">
                    “
                    <EditableContent
                      configKey="pages.about.quote.text"
                      initialValue={quote.text}
                      as="span"
                    />
                    ”
                  </span>
                  <span className="block mt-2 text-sm md:text-base text-slate-500">
                    <EditableContent
                      configKey="pages.about.quote.subText"
                      initialValue={quote.subText}
                    />
                  </span>
                </blockquote>
              </div>
            </CardSection>
          </Section>

          {/* ===== EDUCATION + BIG IMAGE ===== */}
          <Section>
            <CardSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Education */}
                <div>
                  <SectionHeading
                    id="education-path"
                    icon={education.icon}
                    eyebrow={
                      <EditableContent
                        configKey="pages.about.education.eyebrow"
                        initialValue={education.eyebrow}
                      />
                    }
                    title={
                      <EditableContent
                        configKey="pages.about.education.heading"
                        initialValue={education.heading}
                      />
                    }
                    description={
                      <EditableContent
                        configKey="pages.about.education.description"
                        initialValue={education.description}
                      />
                    }
                  />

                  <div className="space-y-0.5">
                    {education.timeline.map((item: any, i: number) => (
                      <TimelineItem
                        key={i}
                        title={
                          <EditableContent
                            configKey={`pages.about.education.timeline.${i}.title`}
                            initialValue={item.title}
                          />
                        }
                        subtitle={
                          <EditableContent
                            configKey={`pages.about.education.timeline.${i}.subtitle`}
                            initialValue={item.subtitle}
                          />
                        }
                        right={item.right}
                        last={i === education.timeline.length - 1}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: image with increased height */}
                <div className="space-y-4">
                  <div className="relative h-[420px] md:h-[520px] rounded-3xl overflow-hidden border bg-white shadow-sm">
                    <EditableImage
                      configKey="pages.about.education.image"
                      initialValue={education.image}
                      alt="University and academic journey"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      aspectRatio={4 / 5}
                    />
                  </div>
                </div>
              </div>
            </CardSection>
          </Section>

          {/* ===== WHAT STUDENTS GET + NUMBERS ===== */}
          <Section>
            <CardSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* LEFT: What students get */}
                <div className="space-y-6">
                  <SectionHeading
                    icon={features.icon}
                    title={
                      <EditableContent
                        configKey="pages.about.features.heading"
                        initialValue={features.heading}
                      />
                    }
                    eyebrow={
                      <EditableContent
                        configKey="pages.about.features.eyebrow"
                        initialValue={features.eyebrow}
                      />
                    }
                    description={
                      <EditableContent
                        configKey="pages.about.features.description"
                        initialValue={features.description}
                      />
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.cards.map((card: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border bg-slate-50/40 p-5 h-full flex flex-col transition-colors hover:bg-slate-50"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <EditableContent
                            configKey={`pages.about.features.cards.${i}.title`}
                            initialValue={card.title}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {card.items.map((item: any, j: number) => (
                            <Pill key={j}>{item}</Pill>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs md:text-sm text-slate-500 max-w-md">
                    <EditableContent
                      configKey="pages.about.features.footer"
                      initialValue={features.footer}
                    />
                  </div>
                </div>

                {/* RIGHT: Numbers */}
                <div className="space-y-6">
                  <SectionHeading
                    icon={stats.icon}
                    title={
                      <EditableContent
                        configKey="pages.about.stats.heading"
                        initialValue={stats.heading}
                      />
                    }
                    eyebrow={
                      <EditableContent
                        configKey="pages.about.stats.eyebrow"
                        initialValue={stats.eyebrow}
                      />
                    }
                    description={
                      <EditableContent
                        configKey="pages.about.stats.description"
                        initialValue={stats.description}
                      />
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.items.map((stat: any, i: number) => (
                      <StatCard
                        key={i}
                        icon={stat.icon}
                        value={
                          <EditableContent
                            configKey={`pages.about.stats.items.${i}.value`}
                            initialValue={stat.value}
                          />
                        }
                        label={
                          <EditableContent
                            configKey={`pages.about.stats.items.${i}.label`}
                            initialValue={stat.label}
                          />
                        }
                        className="h-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardSection>
          </Section>
        </div>
      </main>
    </>
  );
}
