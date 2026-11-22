export const revalidate = 900;
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import Link from "next/link";
import { getSchedule } from "@/lib/scrapers/index.js";
export default async function Page() {
  const { schedule } = await getSchedule("all").catch(() => ({ schedule: {} }));
  const days = Object.entries(schedule || {});
  return (<main className="min-h-screen"><Navbar /><Header title="Jadwal Rilis" />{days.length ? (<div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-2 lg:grid-cols-3">{days.map(([day, items]) => (<section key={day} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"><h3 className="mb-3 text-lg font-extrabold text-fuchsia-400">{day}</h3><ul className="space-y-2">{(items || []).slice(0, 30).map((a) => (<li key={a.slug}><Link href={`/detail/${encodeURIComponent(a.slug)}?source=${a.source || "otakudesu"}`} className="text-sm text-neutral-200 hover:text-fuchsia-300">{a.title}</Link></li>))}</ul></section>))}</div>) : (<p className="py-16 text-center text-neutral-400">Jadwal belum terjangkau dari sumber saat ini.</p>)}</main>);
}
