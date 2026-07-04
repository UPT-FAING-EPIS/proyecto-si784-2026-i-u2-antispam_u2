"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield,
  Radio,
  Search,
  Database,
  Zap,
  LayoutDashboard,
  Check,
  ChevronRight,
  Github,
  Globe,
  Activity,
  Lock,
  ArrowRight,
  Network,
  Cpu,
} from "lucide-react";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

function Section({ children, className = "", id = "" }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Terminal Mockup ───────────────────────────────────────────────────────────

function TerminalBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/20 via-violet-500/10 to-emerald-500/20 blur-xl" />

      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-zinc-500 font-mono">aegis — shield endpoint</span>
        </div>

        <div className="p-6 font-mono text-xs space-y-1.5">
          <p className="text-zinc-500"># REQUEST</p>
          <p>
            <span className="text-violet-400 font-bold">POST</span>
            <span className="text-cyan-400"> /api/v1/shield/check-request</span>
          </p>
          <div className="h-1" />
          <p><span className="text-zinc-400">X-API-Key: </span><span className="text-emerald-400">aegis_k3y_h3re</span></p>
          <p><span className="text-zinc-400">Content-Type: </span><span className="text-emerald-400">application/json</span></p>
          <div className="h-1" />
          <p className="text-zinc-300">{"{"}</p>
          <p className="pl-4"><span className="text-blue-300">&quot;author&quot;</span><span className="text-zinc-500">: </span><span className="text-amber-300">&quot;User123&quot;</span><span className="text-zinc-500">,</span></p>
          <p className="pl-4"><span className="text-blue-300">&quot;content&quot;</span><span className="text-zinc-500">: </span><span className="text-amber-300">&quot;Hola, ¿cómo están?&quot;</span><span className="text-zinc-500">,</span></p>
          <p className="pl-4"><span className="text-blue-300">&quot;client_ip&quot;</span><span className="text-zinc-500">: </span><span className="text-amber-300">&quot;203.0.113.42&quot;</span></p>
          <p className="text-zinc-300">{"}"}</p>

          <div className="border-t border-zinc-800 my-3" />

          <p className="text-zinc-500"># RESPONSE</p>
          <p className="text-emerald-400 font-semibold">✓ 200 OK · 43ms</p>
          <div className="h-1" />
          <p className="text-zinc-300">{"{"}</p>
          <p className="pl-4"><span className="text-blue-300">&quot;safe&quot;</span><span className="text-zinc-500">: </span><span className="text-cyan-300">true</span><span className="text-zinc-500">,</span></p>
          <p className="pl-4"><span className="text-blue-300">&quot;verdict&quot;</span><span className="text-zinc-500">: </span><span className="text-amber-300">&quot;allowed&quot;</span><span className="text-zinc-500">,</span></p>
          <p className="pl-4"><span className="text-blue-300">&quot;checks&quot;</span><span className="text-zinc-500">{": {"}</span></p>
          <p className="pl-8"><span className="text-blue-300">&quot;antispam&quot;</span><span className="text-zinc-500">: </span><span className="text-emerald-300">{"{ \"is_spam\": false }"}</span><span className="text-zinc-500">,</span></p>
          <p className="pl-8"><span className="text-blue-300">&quot;ids&quot;</span><span className="text-zinc-500">: </span><span className="text-emerald-300">{"{ \"is_malicious\": false }"}</span></p>
          <p className="pl-4 text-zinc-300">{"}"}</p>
          <p className="text-zinc-300">{"}"}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── HEADER ────────────────────────────────────────────────────────────────────

function Header() {
  const { data: session } = useSession();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Aegis</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">v1.0</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[["Características", "#características"], ["Precios", "#precios"], ["Documentación", "#documentación"]].map(([label, href]) => (
            <a key={label} href={href} className="text-sm text-zinc-400 hover:text-white transition-colors">{label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
          )}
          <Link
            href="/register"
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Comenzar Gratis <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-72 h-72 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Nuevo: IDS + Antispam + Scanner unificados
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Protección de Grado{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Empresarial
            </span>{" "}
            a Una API de Distancia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-xl"
          >
            Aegis unifica WAF Antispam, Monitoreo IDS de Red y Escaneo de Vulnerabilidades con IA en un
            único gateway FastAPI. Una sola llamada API protege tu plataforma completa.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link
              href="/register"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              Integrar ahora <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#características"
              className="flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-6 py-3 rounded-xl transition-all"
            >
              Ver Documentación <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex gap-10"
          >
            {[["3-en-1", "Motores de seguridad"], ["<50ms", "Latencia promedio"], ["99.9%", "Uptime garantizado"]].map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <TerminalBlock />
      </div>
    </section>
  );
}

// ── FEATURES ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Shield,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/50",
    title: "Shield WAF en Tiempo Real",
    desc: "Filtro antispam avanzado con detección de palabras prohibidas, exceso de URLs y reputación de IP simultánea. Inspección dual en cada solicitud sin latencia adicional.",
    bullets: ["Blacklist configurable dinámica", "Reputación de IP con IDS integrado", "Respuesta en < 50ms"],
  },
  {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    title: "Monitoreo IDS Continuo",
    desc: "Captura de tráfico de red en tiempo real con Scapy. Detecta escaneos de puertos, SYN Flood, ICMP Flood y ataques de fuerza bruta. Alertas almacenadas en MySQL.",
    bullets: ["7 tipos de detección automática", "Alertas persistentes en base de datos", "Dashboard en tiempo real con filtros"],
  },
  {
    icon: Search,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-500/50",
    title: "Escáner de Vulnerabilidades",
    desc: "Pruebas de intrusión automatizadas: XSS, SQLi, CSRF, headers de seguridad, redirecciones abiertas. Reportes con remediación sugerida por IA (Deepseek).",
    bullets: ["6 módulos de escaneo profundo", "Resumen ejecutivo por IA", "Puntuación de riesgo 0-100"],
  },
];

function Features() {
  return (
    <Section id="características" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold tracking-widest uppercase mb-3">Características</p>
          <h2 className="text-4xl font-bold text-white mb-4">Todo lo que necesitas, unificado</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Tres motores de seguridad, una sola API, una sola base de datos. Sin fricciones de integración.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <FadeUp key={feat.title} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`bg-zinc-900 border ${feat.border} rounded-2xl p-7 h-full transition-colors cursor-default`}
              >
                <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5">{feat.desc}</p>
                <ul className="space-y-2">
                  {feat.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 ${feat.color} flex-shrink-0`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── BENEFITS ──────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Database, title: "Base de datos centralizada", desc: "Todos los motores escriben en una única MySQL. Correlaciona alertas IDS con logs de spam y vulnerabilidades en una consulta. Analíticas cruzadas desde el dashboard." },
  { icon: Zap, title: "Latencia mínima con FastAPI", desc: "Backend asíncrono sobre FastAPI + Python 3.12. Antispam e IDS corren en paralelo en cada request del Shield. Respuesta promedio de 43ms." },
  { icon: LayoutDashboard, title: "Dashboard Premium Unificado", desc: "Panel Next.js con actualizaciones en tiempo real. Alertas IDS con colores por severidad, probador de spam live, scanner con resúmenes IA y gestión de API Keys." },
  { icon: Lock, title: "Autenticación multi-nivel", desc: "JWT para el panel de administración y API Keys con scopes para integraciones externas. Formato aegis_* con SHA-256. Compatible con X-API-Key o Bearer token." },
  { icon: Network, title: "Integración en minutos", desc: "Una sola llamada POST reemplaza tres integraciones separadas. Compatible con PHP, Python, Node.js y cualquier cliente HTTP. Swagger automático en /docs." },
  { icon: Cpu, title: "Desplegable con Docker", desc: "docker-compose.yml incluido con tres servicios: MySQL 8, FastAPI y Next.js. Health checks configurados y migraciones automáticas. Production-ready desde el día uno." },
];

function Benefits() {
  return (
    <Section className="py-24 px-6 bg-zinc-900/40 border-y border-zinc-800/50">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="text-center mb-16">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-3">Por qué elegir Aegis</p>
          <h2 className="text-4xl font-bold text-white mb-4">Diseñado para escalar con tu negocio</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            No solo proteges hoy. Construyes la infraestructura de seguridad que crecerá contigo mañana.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((b, i) => (
            <FadeUp key={b.title} delay={i * 0.1}>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <b.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── PRICING ───────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Starter",
    price: "$15",
    period: "/mes",
    desc: "Para proyectos personales y foros pequeños.",
    highlight: false,
    features: ["10,000 peticiones Shield/mes", "1 Escaneo básico/mes", "Alertas IDS estándar", "Retención de datos 7 días", "Dashboard incluido", "Soporte por email"],
    cta: "Comenzar gratis",
    ctaClass: "border border-zinc-700 hover:border-zinc-500 text-white hover:bg-zinc-800",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mes",
    desc: "Para e-commerce y plataformas en crecimiento.",
    highlight: true,
    badge: "Más popular",
    features: ["100,000 peticiones Shield/mes", "4 Escaneos profundos/mes", "IDS avanzado con bloqueo IP", "Retención de datos 30 días", "Análisis IA en reportes", "Soporte prioritario"],
    cta: "Empezar con Pro",
    ctaClass: "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold shadow-lg shadow-cyan-500/30",
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/mes",
    desc: "Para empresas con requisitos avanzados y SLAs.",
    highlight: false,
    features: ["Peticiones Shield ilimitadas", "Escaneos profundos diarios", "IDS con reglas personalizadas", "Retención de datos 1 año", "Reportes ejecutivos PDF", "SLA 99.9% + soporte 24/7"],
    cta: "Contactar ventas",
    ctaClass: "border border-zinc-700 hover:border-zinc-500 text-white hover:bg-zinc-800",
  },
];

function Pricing() {
  return (
    <Section id="precios" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="text-center mb-16">
          <p className="text-violet-400 text-sm font-semibold tracking-widest uppercase mb-3">Precios</p>
          <h2 className="text-4xl font-bold text-white mb-4">Transparente y predecible</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Sin sorpresas. Empieza gratis y escala cuando lo necesites. Cancela en cualquier momento.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative rounded-2xl p-8 h-full flex flex-col border transition-colors ${plan.highlight ? "bg-zinc-900 border-cyan-500/50 shadow-2xl shadow-cyan-500/10" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"}`}
              >
                {"badge" in plan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-zinc-950 text-xs font-bold px-4 py-1.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-cyan-400" : "text-emerald-400"}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link href="/register" className={`block text-center py-3 px-6 rounded-xl text-sm font-semibold transition-all ${plan.ctaClass}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Aegis</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Gateway de seguridad unificado para desarrolladores y plataformas digitales.
            </p>
            <div className="flex gap-3">
              {[Github, Globe, Activity].map((Icon, i) => (
                <a key={i} href="#" className="text-zinc-500 hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Producto", links: ["Características", "Precios", "Changelog", "Roadmap"] },
            { title: "Documentación", links: ["Inicio rápido", "API Reference", "Ejemplos PHP", "Webhooks"] },
            { title: "Legal", links: ["Términos de uso", "Privacidad", "Seguridad", "Estado del sistema"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-zinc-400 text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">© 2026 Aegis Security Gateway. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Todos los sistemas operativos
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen overflow-x-hidden antialiased">
      <Header />
      <Hero />
      <Features />
      <Benefits />
      <Pricing />
      <Footer />
    </div>
  );
}
