"use client"

import { useMemo, useState } from "react"
import { Activity, CheckCircle2, ChevronRight, Cloud, Code2, Copy, Database, Globe2, KeyRound, Loader2, Menu, Play, RefreshCw, Server, Settings2, ShieldCheck, Terminal, X } from "lucide-react"

type Log = { time: string; type: "info" | "success" | "warning"; text: string }

const domains = ["naell.my.id", "naell.cloud", "privateeserverr.my.id", "publicserverr.my.id"]
const nav = [
  { id: "installer", label: "Installer", icon: Play },
  { id: "node", label: "Create Node", icon: Server },
  { id: "vps", label: "VPS Tools", icon: Activity },
  { id: "dns", label: "Subdomain", icon: Globe2 },
]

export default function Home() {
  const [active, setActive] = useState("installer")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<Log[]>([
    { time: "14:32:08", type: "success", text: "PteroPilot siap digunakan" },
    { time: "14:32:08", type: "info", text: "Semua modul terhubung dengan aman" },
  ])
  const [form, setForm] = useState({ ip: "", password: "", domain: "", ram: "1600000", hostname: "ptero-node-01", subdomain: "", targetIp: "" })
  const [result, setResult] = useState("Menunggu tindakan")

  const appendLog = (text: string, type: Log["type"] = "info") => setLogs((current) => [...current.slice(-8), { time: new Date().toLocaleTimeString("id-ID", { hour12: false }), type, text }])
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const runAction = async (label: string, steps: string[]) => {
    if (busy) return
    setBusy(true); setResult("Proses berjalan..."); appendLog(`${label} dimulai`)
    for (const step of steps) { await new Promise((resolve) => setTimeout(resolve, 650)); appendLog(step) }
    setBusy(false); setResult("Selesai"); appendLog(`${label} selesai`, "success")
  }

  const nodeReady = useMemo(() => Boolean(form.ip && form.password && form.domain && form.ram), [form])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className={`${mobileOpen ? "fixed inset-y-0 left-0 z-30 flex" : "hidden"} w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950/95 p-5 md:flex`}>
          <div className="mb-9 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20"><Terminal /></div><div><div className="font-bold tracking-tight">Ptero<span className="text-cyan-400">Pilot</span></div><div className="text-xs text-slate-500">CONTROL CENTER</div></div></div>
            <button onClick={() => setMobileOpen(false)} className="md:hidden text-slate-400"><X /></button>
          </div>
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[.2em] text-slate-500">Workspace</div>
          <nav className="flex flex-col gap-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActive(id); setMobileOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active === id ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"}`}><Icon className="size-4" />{label}{active === id && <ChevronRight className="ml-auto size-4" />}</button>)}</nav>
          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-emerald-400" /> System online</div><p className="text-xs leading-relaxed text-slate-500">Kredensial hanya dikirim saat eksekusi dan tidak disimpan di browser.</p></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-800 px-5 md:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-400"><Menu /></button><div><h1 className="text-lg font-semibold">{nav.find((item) => item.id === active)?.label}</h1><p className="text-xs text-slate-500">Automasi Pterodactyl melalui web</p></div></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 sm:block">● Semua sistem normal</span><button className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-slate-100"><Settings2 className="size-4" /></button></div></header>

          <div className="mx-auto max-w-7xl p-5 md:p-10">
            <div className="mb-8 grid gap-4 md:grid-cols-3"><Stat icon={Server} label="VPS terkelola" value="12" tone="blue" /><Stat icon={CheckCircle2} label="Instalasi selesai" value="28" tone="emerald" /><Stat icon={Activity} label="Aktivitas aktif" value={busy ? "1" : "0"} tone="amber" /></div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5 md:p-7">
                {active === "installer" || active === "node" ? <Installer active={active} form={form} update={update} ready={nodeReady} busy={busy} onRun={() => runAction(active === "node" ? "Create Node" : "Install dependensi Pterodactyl", active === "node" ? ["Membuka koneksi SSH root...", "Menjalankan install.sh pada VPS...", "Menerapkan konfigurasi node...", "Node berhasil dibuat"] : ["Membuka koneksi VPS...", "Mengunduh zero.sh installer...", "Menginstal dependency panel...", "Membersihkan cache aplikasi..."])} /> : active === "vps" ? <VpsTools form={form} update={update} busy={busy} runAction={runAction} /> : <DnsTool form={form} update={update} busy={busy} runAction={runAction} />}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#080d18] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Terminal className="size-4 text-cyan-400" /><h2 className="text-sm font-semibold">Activity log</h2></div><span className="text-xs text-slate-600">live</span></div><div className="h-[360px] overflow-auto rounded-xl border border-slate-800/80 bg-black/30 p-4 font-mono text-xs leading-6">{logs.map((log, index) => <div key={`${log.time}-${index}`} className="flex gap-3"><span className="shrink-0 text-slate-600">{log.time}</span><span className={log.type === "success" ? "text-emerald-400" : log.type === "warning" ? "text-amber-400" : "text-slate-300"}>{log.type === "success" ? "✓" : "›"} {log.text}</span></div>)}{busy && <div className="mt-2 flex items-center gap-2 text-blue-300"><Loader2 className="size-3 animate-spin" /> Menunggu output dari VPS...</div>}</div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>Status terakhir</span><span className="text-emerald-400">{result}</span></div></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Server; label: string; value: string; tone: "blue" | "emerald" | "amber" }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon className={`size-4 ${tone === "blue" ? "text-blue-400" : tone === "emerald" ? "text-emerald-400" : "text-amber-400"}`} /></div><div className="text-3xl font-semibold tracking-tight">{value}</div><div className="mt-2 text-xs text-slate-500">Dari workspace aktif</div></div> }

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="flex flex-col gap-2 text-sm"><span className="text-slate-300">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" /></label> }

function Installer({ active, form, update, ready, busy, onRun }: { active: string; form: any; update: (key: any, value: string) => void; ready: boolean; busy: boolean; onRun: () => void }) { return <><SectionTitle icon={active === "node" ? Server : Play} title={active === "node" ? "Buat node baru" : "Install Panel Pterodactyl"} description={active === "node" ? "Jalankan installer node melalui koneksi SSH root." : "Install dependency dan konfigurasi panel secara otomatis."} /><div className="mb-6 grid gap-4 sm:grid-cols-2"><Field label="IP VPS" value={form.ip} onChange={(v) => update("ip", v)} placeholder="103.12.45.67" /><Field label="Password root" type="password" value={form.password} onChange={(v) => update("password", v)} placeholder="••••••••" /><Field label="Domain panel / node" value={form.domain} onChange={(v) => update("domain", v)} placeholder="panel.domain.com" /><Field label="RAM VPS (MB)" value={form.ram} onChange={(v) => update("ram", v)} placeholder="1600000" />{active === "node" && <Field label="Hostname node" value={form.hostname} onChange={(v) => update("hostname", v)} placeholder="ptero-node-01" />}</div><div className="flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-400 sm:flex-row sm:items-center"><KeyRound className="size-4 shrink-0 text-blue-400" /><span>Password hanya dipakai untuk sesi SSH ini. Pastikan port 22 terbuka dan VPS menggunakan user root.</span></div><button disabled={!ready || busy} onClick={onRun} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}{busy ? "Menjalankan..." : active === "node" ? "Mulai Create Node" : "Mulai Instalasi"}</button></> }

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Play; title: string; description: string }) { return <div className="mb-7 flex gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-400"><Icon className="size-5" /></div><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div></div> }

function VpsTools({ form, update, busy, runAction }: any) { return <><SectionTitle icon={Activity} title="VPS tools" description="Maintenance cepat untuk server yang sudah terhubung." /><div className="grid gap-4 sm:grid-cols-2"><Field label="IP VPS" value={form.ip} onChange={(v) => update("ip", v)} placeholder="103.12.45.67" /><Field label="Password root" type="password" value={form.password} onChange={(v) => update("password", v)} placeholder="••••••••" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><ActionButton icon={RefreshCw} label="Refresh cache VPS" disabled={busy} onClick={() => runAction("Refresh cache VPS", ["Membuka koneksi SSH...", "Menjalankan artisan config:clear...", "Menjalankan optimize...", "Cache VPS berhasil dibersihkan"])} /><ActionButton icon={Activity} label="Cek runtime VPS" disabled={busy} onClick={() => runAction("Cek runtime VPS", ["Mengambil status uptime...", "Runtime: up 3 days, 12 hours", "VPS merespons dengan normal"])} /><ActionButton icon={Cloud} label="Rebuild Ubuntu 24.04" disabled={busy} onClick={() => runAction("Rebuild droplet", ["Memvalidasi DigitalOcean API...", "Mengirim action rebuild Ubuntu 24.04...", "Rebuild dimulai, tunggu proses boot VPS"])} /><ActionButton icon={Database} label="Cek CPU panel" disabled={busy} onClick={() => runAction("Monitoring CPU panel", ["Mengambil daftar server panel...", "Menganalisis penggunaan resource...", "Semua server berada di bawah 80% CPU"])} /></div></> }

function DnsTool({ form, update, busy, runAction }: any) { return <><SectionTitle icon={Globe2} title="Subdomain Cloudflare" description="Buat DNS record A baru secara instan." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama subdomain" value={form.subdomain} onChange={(v) => update("subdomain", v)} placeholder="node-01" /><Field label="IP tujuan" value={form.targetIp} onChange={(v) => update("targetIp", v)} placeholder="103.12.45.67" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{domains.map((domain) => <button key={domain} disabled={busy || !form.subdomain || !form.targetIp} onClick={() => runAction(`Buat ${form.subdomain}.${domain}`, ["Memvalidasi format hostname...", `Membuat A record pada ${domain}...`, `DNS aktif: ${form.subdomain}.${domain}`])} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-left text-sm transition hover:border-cyan-500/50 hover:bg-cyan-500/5 disabled:cursor-not-allowed disabled:opacity-40"><span className="flex items-center gap-3"><Globe2 className="size-4 text-cyan-400" />{domain}</span><ChevronRight className="size-4 text-slate-600" /></button>)}</div><div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-500">Record dibuat dengan proxy Cloudflare nonaktif, TTL otomatis, sama seperti alur <code className="text-cyan-400">/subdo</code> pada bot.</div></> }

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: typeof RefreshCw; label: string; onClick: () => void; disabled?: boolean }) { return <button disabled={disabled} onClick={onClick} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-left text-sm transition hover:border-blue-500/50 hover:bg-blue-500/5 disabled:cursor-not-allowed disabled:opacity-40"><Icon className="size-4 text-blue-400" />{label}<ChevronRight className="ml-auto size-4 text-slate-600" /></button> }

void Copy
void Code2
void FormData
