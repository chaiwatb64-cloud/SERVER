
import React, { useEffect, useMemo, useRef, useState } from "react";

// BioMINTech — Stock Tracker (React + TypeScript)
// -------------------------------------------------
// - table-auto (no horizontal scroll) + wider status cell
// - multi-checker audit (checkedBy) with editable member list (add/remove), persisted in localStorage
// - localStorage persistence for items and cover
// - search / filter / sort (Thai locale)
// - cover image (default /BioMINTech.png)
// - minimal self-tests (don’t change; only add new if needed)

// ---------- Types ----------
export type Status = "ปกติ" | "ใกล้หมด" | "หมด";
export type Item = {
  id: number;
  category: string;
  name: string;
  qty: number;
  unit: string;
  status: Status;
  location: string;
  checkedBy?: string[];
  lastUpdated?: string; // ISO
};

// ---------- Helpers & Constants ----------
const STORAGE_KEY = "inventory.thai.lab.v5";
const COVER_KEY = "inventory.coverUrl.v1";
const CHECKERS_KEY = "inventory.checkers.v1";

const DEFAULT_CHECKERS = [
  "Nice","Fah","Anont","Air","Ploy","Aum","Film","Aun","Ning","New","Tong"
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function statusColor(s: Status) {
  return s === "หมด"
    ? "bg-red-100 text-red-700 border-red-200"
    : s === "ใกล้หมด"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function nowISO() { return new Date().toISOString(); }

function formatDateThai(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function computeStatus(qty: number, low: number): Status {
  if (qty <= 0) return "หมด";
  if (qty <= low) return "ใกล้หมด";
  return "ปกติ";
}

function nextId(items: Item[]): number {
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

// ---------- Seed ----------
const SEED: Item[] = [
  { id: 1, category: "หมวดของใช้จิปาถะ", name: "ทิชชู่", qty: 0, unit: "ม้วน", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 2, category: "หมวดของใช้จิปาถะ", name: "น้ำยาล้างมิอ", qty: 2, unit: "ถุง/ขวด", status: "ปกติ", location: "อ่างล้างจาน" },
  { id: 3, category: "หมวดของใช้จิปาถะ", name: "น้ำยาล้างจาน", qty: 1, unit: "ถุง/ขวด", status: "ใกล้หมด", location: "อ่างล้างจาน" },
  { id: 4, category: "หมวดของใช้จิปาถะ", name: "Dettol", qty: 1, unit: "ถุง/ขวด", status: "ใกล้หมด", location: "อ่างล้างจาน" },
  { id: 5, category: "หมวดของใช้จิปาถะ", name: "ถุง 7 ", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 6, category: "หมวดของใช้จิปาถะ", name: "ถุง 8 ", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 7, category: "หมวดของใช้จิปาถะ", name: "ถุง 9 ", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 8, category: "หมวดของใช้จิปาถะ", name: "ถุง 10", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 9, category: "หมวดของใช้จิปาถะ", name: "ถุง 12 ", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 10, category: "หมวดของใช้จิปาถะ", name: "ถุง 24 ", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 11, category: "หมวดของใช้จิปาถะ", name: "หนังยาง", qty: 0, unit: "แพ็ค", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 12, category: "หมวดของใช้จิปาถะ", name: "ฟรอยด์", qty: 0, unit: "กล่อง", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 13, category: "หมวดของใช้จิปาถะ", name: "สำลี", qty: 1, unit: "ถุง", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 14, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size S", qty: 6, unit: "กล่อง", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 15, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size M", qty: 6, unit: "กล่อง", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 16, category: "หมวดของใช้ทั่วไป", name: "ถุงมือ size L", qty: 2, unit: "กล่อง", status: "ใกล้หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 17, category: "หมวดของใช้ทั่วไป", name: "กล่องทิป", qty: 36, unit: "กล่อง", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 18, category: "หมวดของใช้ทั่วไป", name: "Tips 10 ul", qty: 8, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 19, category: "หมวดของใช้ทั่วไป", name: "Tips 200 ul", qty: 4, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 20, category: "หมวดของใช้ทั่วไป", name: "Tips 1000 ul", qty: 1, unit: "แพ็ค", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 21, category: "หมวดของใช้ทั่วไป", name: "Microcentrifuge (1.5ml)", qty: 13, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 22, category: "หมวดของใช้ทั่วไป", name: "ฟิลเตอร์ 0.22 um (เล็ก)", qty: 32, unit: "อัน", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 23, category: "หมวดของใช้ทั่วไป", name: "Tube 15 ml", qty: 6, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 24, category: "หมวดของใช้ทั่วไป", name: "Tube 50 ml", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 25, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 250 ml ", qty: 0, unit: "ขวด", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 26, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 500  ml ", qty: 6, unit: "ขวด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 27, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 1000 ml ", qty: 4, unit: "ขวด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 28, category: "หมวดของใช้ทั่วไป", name: "ขวด Duran 2000 ml", qty: 0, unit: "ขวด", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 29, category: "หมวดของใช้ทั่วไป", name: "ไซริ้งค์ 10 ml ", qty: 4, unit: "อัน", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 30, category: "หมวดของใช้ทั่วไป", name: "ไซริ้งค์ 50 ml ", qty: 16, unit: "อัน", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 31, category: "หมวดของใช้ทั่วไป", name: "กล่องตัวอย่าง", qty: 39, unit: "กล่อง", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 32, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร MEM", qty: 0, unit: "แพ็ค", status: "หมด", location: "ตู้เย็น" },
  { id: 33, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร DMEM", qty: 16, unit: "ซอง", status: "ปกติ", location: "ตู้เย็น" },
  { id: 34, category: "หมวดเลี้ยงเซลล์", name: "อาหารสูตร RPMI", qty: 11, unit: "ซอง", status: "ปกติ", location: "ตู้เย็น" },
  { id: 35, category: "หมวดเลี้ยงเซลล์", name: "FBS stock", qty: 1, unit: "ขวด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 36, category: "หมวดเลี้ยงเซลล์", name: "FBS ขวดแบ่ง", qty: 12, unit: "หลอด", status: "ปกติ", location: "ตู้เย็น" },
  { id: 37, category: "หมวดเลี้ยงเซลล์", name: "Cryotube", qty: 0, unit: "แพ็ค", status: "หมด", location: "ชั้นเก็บของ" },
  { id: 38, category: "หมวดเลี้ยงเซลล์", name: "Pipette พลาสติก 10 ml", qty: 1, unit: "กล่อง", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 39, category: "หมวดเลี้ยงเซลล์", name: "ชุดกรอง media ", qty: 30, unit: "ชุด", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 40, category: "หมวดเลี้ยงเซลล์", name: "Dish 35*10 mm", qty: 45, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 41, category: "หมวดเลี้ยงเซลล์", name: "Dish 90*20 mm ", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 42, category: "หมวดเลี้ยงเซลล์", name: "Flask T25", qty: 17, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 43, category: "หมวดเลี้ยงเซลล์", name: "Flask T75", qty: 8, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 44, category: "หมวดเลี้ยงเซลล์", name: "Scraper", qty: 73, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 45, category: "หมวดเลี้ยงเซลล์", name: "6well plate", qty: 30, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 46, category: "หมวดเลี้ยงเซลล์", name: "12well plate", qty: 44, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 47, category: "หมวดเลี้ยงเซลล์", name: "96well plate", qty: 50, unit: "แพ็ค", status: "ปกติ", location: "ชั้นเก็บของ" },
  { id: 48, category: "หมวดเลี้ยงเซลล์", name: "Sheath fluid", qty: 2, unit: "ขวด", status: "ใกล้หมด", location: "ชั้นเก็บของ" },
  { id: 49, category: "หมวดเลี้ยงเซลล์", name: "Paraflim", qty: 0, unit: "กล่อง", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 50, category: "หมวดเลี้ยงเซลล์", name: "Trypsin stock", qty: 0, unit: "ขวด", status: "หมด", location: "ตู้เย็น" },
  { id: 51, category: "หมวดเลี้ยงเซลล์", name: "Trypsin-EDTA ", qty: 1, unit: "หลอด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 52, category: "หมวดเลี้ยงเซลล์", name: "Pan/step", qty: 2, unit: "หลอด", status: "ใกล้หมด", location: "ตู้เย็น" },
  { id: 53, category: "หมวดเลี้ยงเซลล์", name: "Trypan blue", qty: 1, unit: "หลอด", status: "หมด", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 54, category: "หมวดเลี้ยงเซลล์", name: "HCl", qty: 40, unit: "ml", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
  { id: 55, category: "หมวดเลี้ยงเซลล์", name: "DMSO", qty: 2500, unit: "ml", status: "ปกติ", location: "โต๊ะแลป/ลิ้นชัก" },
];

// ---------- Filter & Sort ----------
export type SortKey = keyof Item;
function filterAndSort(items: Item[], filters: { q?: string; category?: string; status?: Status | "ทั้งหมด"; location?: string; onlyLow?: boolean; }, sort: { key: SortKey; asc: boolean; }) {
  const q = (filters.q ?? "").toLowerCase();
  let out = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q));
  if ((filters.category ?? "ทั้งหมด") !== "ทั้งหมด") out = out.filter(i => i.category === filters.category);
  if ((filters.status ?? "ทั้งหมด") !== "ทั้งหมด") out = out.filter(i => i.status === filters.status);
  if ((filters.location ?? "ทั้งหมด") !== "ทั้งหมด") out = out.filter(i => i.location === filters.location);
  if (filters.onlyLow) out = out.filter(i => i.status !== "ปกติ");
  const { key, asc } = sort;
  const cmp = (a: Item, b: Item) => {
    const A: any = a[key] as any, B: any = b[key] as any;
    if (key === "qty" || key === "id") {
      const nA = Number.isFinite(Number(A)) ? Number(A) : 0;
      const nB = Number.isFinite(Number(B)) ? Number(B) : 0;
      const res = nA - nB; return asc ? res : -res;
    }
    if (key === "lastUpdated") {
      const tA = A ? new Date(A).getTime() : 0;
      const tB = B ? new Date(B).getTime() : 0;
      const res = tA - tB; return asc ? res : -res;
    }
    const res = String(A ?? "").localeCompare(String(B ?? ""), "th");
    return asc ? res : -res;
  };
  return [...out].sort(cmp);
}

// ---------- UI Components ----------
function TrHead({ children }: { children: React.ReactNode }) {
  return <tr className="text-xs font-semibold uppercase tracking-wide">{children}</tr>;
}

function Th({ label, sortKey, sortState, onSort }: { label: string; sortKey: keyof Item; sortState: [keyof Item, boolean]; onSort: (k: keyof Item) => void; }) {
  const [curKey, asc] = sortState;
  const active = curKey === sortKey;
  return (
    <th className="px-3 py-2 select-none text-left">
      <button onClick={() => onSort(sortKey)} className={classNames("inline-flex items-center gap-1", active && "text-slate-900")}>
        <span>{label}</span>
        <span className="text-slate-400">{active ? (asc ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

// ---------- Main Component ----------
export default function InventoryApp() {
  const [items, setItems] = useState<Item[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : SEED;
  });

  // editable checker list (persisted)
  const [checkers, setCheckers] = useState<string[]>(() => {
    const raw = localStorage.getItem(CHECKERS_KEY);
    try { return raw ? (JSON.parse(raw) as string[]) : DEFAULT_CHECKERS; } catch { return DEFAULT_CHECKERS; }
  });
  useEffect(() => { localStorage.setItem(CHECKERS_KEY, JSON.stringify(checkers)); }, [checkers]);

  // filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");
  const [stat, setStat] = useState<Status | "ทั้งหมด">("ทั้งหมด");
  const [loc, setLoc] = useState("ทั้งหมด");
  const [onlyLow, setOnlyLow] = useState(false);

  // sort
  const [sortKey, setSortKey] = useState<keyof Item>("id");
  const [sortAsc, setSortAsc] = useState(true);
  function setSort(key: keyof Item) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  // auto status
  const [autoStatus, setAutoStatus] = useState(true);
  const [lowThreshold, setLowThreshold] = useState(1);

  // cover
  const [coverUrl, setCoverUrl] = useState<string | null>(() => localStorage.getItem(COVER_KEY) ?? "/BioMINTech.png");
  const coverInputRef = useRef<HTMLInputElement>(null);
  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setCoverUrl(String(reader.result)); reader.readAsDataURL(file);
  }
  useEffect(() => { if (coverUrl !== null) localStorage.setItem(COVER_KEY, coverUrl); }, [coverUrl]);

  // persist items
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  // derived
  const categories = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(items.map(i => i.category)))], [items]);
  const locations = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(items.map(i => i.location)))], [items]);
  const statuses = ["ทั้งหมด", "ปกติ", "ใกล้หมด", "หมด"] as const;

  const filtered = useMemo(() => filterAndSort(items, { q, category: cat, status: stat, location: loc, onlyLow }, { key: sortKey, asc: sortAsc }), [items, q, cat, stat, loc, onlyLow, sortKey, sortAsc]);

  const summary = useMemo(() => ({ total: items.length, low: items.filter(i => i.status === "ใกล้หมด").length, empty: items.filter(i => i.status === "หมด").length }), [items]);

  // --- Quick-Check Modal State ---
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkTarget, setCheckTarget] = useState<Item | null>(null);
  const [checkSelected, setCheckSelected] = useState<Set<string>>(new Set());

  function openQuickCheck(it: Item) {
    setCheckTarget(it);
    setCheckSelected(new Set(it.checkedBy ?? []));
    setCheckOpen(true);
  }
  function toggleChecker(name: string) {
    setCheckSelected(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  }
  function confirmQuickCheck() {
    if (!checkTarget) return;
    const list = Array.from(checkSelected);
    setItems(prev => prev.map(i => i.id === checkTarget.id ? { ...i, checkedBy: list, lastUpdated: nowISO() } : i));
    setCheckOpen(false); setCheckTarget(null);
  }

  // --- Manage Members Modal State ---
  const [membersOpen, setMembersOpen] = useState(false);
  const [newMember, setNewMember] = useState("");
  function addMember() {
    const name = newMember.trim(); if (!name) return;
    if (checkers.some(c => c.toLowerCase() === name.toLowerCase())) { alert("มีชื่อนี้อยู่แล้ว"); return; }
    setCheckers(prev => [...prev, name]); setNewMember("");
  }
  function removeMember(name: string) {
    if (!confirm(`ลบผู้ตรวจ "${name}" ?`)) return;
    setCheckers(prev => prev.filter(n => n !== name));
  }

  // self-tests (don’t change existing; add only)
  useEffect(() => {
    try {
      const s = ["ข", "ก"]; const sorted = [...s].sort((a,b)=>a.localeCompare(b,"th"));
      if (sorted[0] !== "ก") throw new Error("localeCompare(th) failed");
      const res = filterAndSort(SEED.slice(0,3), { q: "น้ำยา" }, { key: "name", asc: true });
      if (!res.length) throw new Error("filter failed");
      const byQtyDesc = filterAndSort(SEED.slice(0,5), {}, { key: "qty", asc: false });
      if (byQtyDesc[0].qty < byQtyDesc[1].qty) throw new Error("numeric sort desc failed");
      console.log("✅ self-tests passed");
    } catch (e) { console.error("❌ self-tests failed", e); }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">ระบบติดตามสต๊อก (BioMINTech)</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setOnlyLow(v=>!v)} className={classNames("px-3 py-2 rounded-xl border", onlyLow ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-slate-300 hover:bg-slate-50")}>
              เฉพาะใกล้หมด/หมด
            </button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoStatus} onChange={(e)=>setAutoStatus(e.target.checked)} /> ปรับสถานะอัตโนมัติ
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              เกณฑ์ ≤
              <input type="number" min={1} value={lowThreshold} onChange={(e)=>setLowThreshold(Math.max(1, Number(e.target.value)))} className="w-16 px-2 py-1 rounded-lg border border-slate-300" />
            </label>
            <button onClick={() => setMembersOpen(true)} className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50" title="จัดการผู้ตรวจ">จัดการผู้ตรวจ</button>
            <input ref={coverInputRef} onChange={onPickCover} type="file" accept="image/*" className="hidden" />
            <button onClick={()=>coverInputRef.current?.click()} className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50" title="ตั้งค่า Cover">ตั้งค่า Cover</button>
          </div>
        </div>
      </header>

      {/* cover */}
      <section className="w-full">
        {coverUrl ? (
          <div className="relative">
            <img src={coverUrl} alt="BioMINTech Cover" className="w-full max-h-64 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 text-white drop-shadow-md">
              <div className="text-xs uppercase tracking-wide opacity-90">Laboratory</div>
              <div className="text-2xl font-bold">BioMINTech</div>
              <div className="text-sm opacity-90">Biochemical Molecular Interactions and Nucleic Acid Technologies</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-200 h-28 md:h-36 grid place-items-center text-slate-600 text-sm">เพิ่มรูปปกของแล็บโดยกดปุ่ม "ตั้งค่า Cover" ด้านบน</div>
        )}
      </section>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <SummaryCard label="ทั้งหมด" value={summary.total} sub="รายการ" />
          <SummaryCard label="ใกล้หมด" value={summary.low} sub="รายการ" tone="amber" />
          <SummaryCard label="หมด" value={summary.empty} sub="รายการ" tone="red" />
        </div>

        {/* filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end mb-4">
          <div className="lg:col-span-2">
            <label className="text-sm">ค้นหา</label>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="ชื่อสิ่งของ / หมวดหมู่ / สถานที่" className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <Select label="หมวดหมู่" value={cat} setValue={setCat} options={categories} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="สถานะ" value={stat as string} setValue={(v)=>setStat(v as any)} options={[...statuses] as unknown as string[]} />
            <Select label="ที่จัดเก็บ" value={loc} setValue={setLoc} options={locations} />
          </div>
        </div>

        {/* table */}
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-slate-50 text-slate-600">
              <TrHead>
                <Th label="ลำดับ" sortKey="id" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="หมวดหมู่" sortKey="category" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="ชื่อสิ่งของ" sortKey="name" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="จำนวนคงเหลือ" sortKey="qty" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="หน่วย" sortKey="unit" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="สถานะ" sortKey="status" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="สถานที่จัดเก็บ" sortKey="location" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <Th label="อัปเดตล่าสุด" sortKey="lastUpdated" sortState={[sortKey, sortAsc]} onSort={setSort} />
                <th className="px-3 py-2 text-left">ตรวจโดย</th>
                <th className="px-3 py-2 text-right">การทำงาน</th>
              </TrHead>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className={classNames("border-t border-slate-100", it.status === "หมด" && "bg-red-50", it.status === "ใกล้หมด" && "bg-amber-50/40")}> 
                  <td className="px-3 py-2 whitespace-nowrap">{it.id}</td>
                  <td className="px-3 py-2">{it.category}</td>
                  <td className="px-3 py-2 font-medium">{it.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.qty.toLocaleString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.unit}</td>
                  <td className="px-3 py-2 whitespace-nowrap min-w-[5rem]">
                    <span className={classNames("inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold", statusColor(it.status))}>{it.status}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.location}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateThai(it.lastUpdated)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{(it.checkedBy ?? []).join(", ") || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={()=>adjustQty(it.id, -1)} className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50" title="-1">−1</button>
                      <button onClick={()=>adjustQty(it.id, +1)} className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50" title="+1">+1</button>
                      <button onClick={()=>openQuickCheck(it)} className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">ตรวจแล้ว</button>
                      <button onClick={()=>openEdit(it)} className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">แก้ไข</button>
                      <button onClick={()=>remove(it.id)} className="px-2 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500">ไม่พบรายการที่ตรงกับเงื่อนไข</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Quick-Check Modal */}
      {checkOpen && checkTarget && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCheckOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold mb-3">ตรวจแล้ว: {checkTarget.name}</h2>
              <div className="flex flex-wrap gap-2">
                {checkers.map((name) => (
                  <button key={name} onClick={() => toggleChecker(name)} className={classNames("px-3 py-1 rounded-full border", checkSelected.has(name) ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300 hover:bg-slate-50")}>{name}</button>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setCheckOpen(false)} className="px-3 py-2 rounded-xl border bg-white">ยกเลิก</button>
                <button onClick={confirmQuickCheck} className="px-3 py-2 rounded-xl bg-slate-900 text-white">บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {membersOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMembersOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold mb-3">จัดการผู้ตรวจ</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {checkers.map((name) => (
                  <div key={name} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white">
                    <span>{name}</span>
                    <button onClick={() => removeMember(name)} className="text-rose-600 hover:text-rose-700" title="ลบ">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input value={newMember} onChange={(e)=>setNewMember(e.target.value)} placeholder="เพิ่มชื่อ (อังกฤษ)" className="flex-1 px-3 py-2 rounded-xl border border-slate-300" />
                <button onClick={addMember} className="px-3 py-2 rounded-xl bg-slate-900 text-white">เพิ่ม</button>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={()=>setMembersOpen(false)} className="px-3 py-2 rounded-xl border bg-white">เสร็จสิ้น</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} BioMINTech Inventory</footer>
    </div>
  );

  // ---------- Inline handlers used in table buttons ----------
  function openEdit(it: Item) {
    // (Editor modal omitted for brevity in this version)
    console.log("OPEN EDIT", it);
  }
  function remove(id: number) {
    if (!confirm("ลบรายการนี้ใช่ไหม?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function adjustQty(id: number, delta: number) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, i.qty + delta);
      const newStatus = autoStatus ? computeStatus(newQty, lowThreshold) : i.status;
      return { ...i, qty: newQty, status: newStatus, lastUpdated: nowISO() };
    }));
  }
}

// ---------- Small presentational helpers ----------
function SummaryCard({ label, value, sub, tone = "slate" }: { label: string; value: number; sub?: string; tone?: "slate" | "amber" | "red"; }) {
  const tones: Record<string, string> = { slate: "bg-slate-50 border-slate-200", amber: "bg-amber-50 border-amber-200", red: "bg-red-50 border-red-200" };
  return (
    <div className={classNames("rounded-2xl p-4 border", tones[tone])}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-3xl font-semibold">{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[]; }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <select value={value} onChange={(e)=>setValue(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}
