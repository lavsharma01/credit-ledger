// In-memory fake CreditLedger for NEXT_PUBLIC_USE_MOCK=true. Enforces the same
// rules and throws the same custom errors as docs/INTERFACE.md so the UI behaves
// identically in both modes. State is mirrored to localStorage so a page reload
// during a demo keeps what you registered.
import { getAddress, keccak256, parseEther, toHex, type Address, type Hash, type Hex } from "viem";
import { MockContractError } from "@/lib/errors";
import { BPS_TOTAL, MAX_CONTRIBUTORS, type Contributor, type RegisterWorkInput, type Work } from "@/lib/types";
import { MOCK_ACCOUNTS } from "./accounts";

type State = {
  works: Work[]; // index = id - 1
  contributors: Contributor[][];
  pending: Record<string, bigint>; // lowercase address -> wei
};

const STORAGE_KEY = "credit-ledger:mock:v1";
const [alice, bob, ai] = MOCK_ACCOUNTS.map((a) => a.address);
const now = () => BigInt(Math.floor(Date.now() / 1000));
const demoHash = (s: string) => keccak256(toHex(s));

function seed(): State {
  const state: State = { works: [], contributors: [], pending: {} };
  const t = now();
  insert(state, alice, {
    contentHash: demoHash("midnight-circuit.mp3"),
    title: "Midnight Circuit (single)",
    metadataURI: "",
    aiAssisted: true,
    wallets: [alice, bob, ai],
    roles: ["Writer", "Producer", "Suno (AI vocals)"],
    sharesBps: [5000, 3000, 2000],
  }, t - 86_400n * 3n);
  confirmAll(state, 1n);
  credit(state, 1n, parseEther("0.05"));

  insert(state, alice, {
    contentHash: demoHash("neon-koi.png"),
    title: "Neon Koi (illustration)",
    metadataURI: "",
    aiAssisted: true,
    wallets: [alice, ai],
    roles: ["Illustrator", "Midjourney (AI image model)"],
    sharesBps: [7000, 3000],
  }, t - 86_400n);

  insert(state, bob, {
    contentHash: demoHash("why-provenance-matters.md"),
    title: "Why Provenance Matters (article)",
    metadataURI: "",
    aiAssisted: false,
    wallets: [bob],
    roles: ["Writer"],
    sharesBps: [BPS_TOTAL],
  }, t - 3_600n);
  return state;
}

// ---------- persistence ----------

let state: State | undefined;

function load(): State {
  if (state) return state;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      state = JSON.parse(raw, (_k, v) => (typeof v === "string" && /^\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v));
    }
  } catch {
    // corrupted or blocked storage: fall back to seed data
  }
  state ??= seed();
  return state!;
}

function save() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state, (_k, v) => (typeof v === "bigint" ? `${v}n` : v)),
    );
  } catch {
    // storage unavailable (private window etc.): state stays in memory only
  }
}

export function resetMockStore() {
  state = seed();
  save();
}

// ---------- internals ----------

function insert(s: State, sender: Address, input: RegisterWorkInput, registeredAt = now()): bigint {
  const { wallets, roles, sharesBps } = input;
  if (wallets.length === 0) throw new MockContractError("EmptyContributors");
  if (wallets.length > MAX_CONTRIBUTORS) throw new MockContractError("TooManyContributors");
  if (roles.length !== wallets.length || sharesBps.length !== wallets.length) {
    throw new MockContractError("LengthMismatch");
  }
  if (s.works.some((w) => w.contentHash.toLowerCase() === input.contentHash.toLowerCase())) {
    throw new MockContractError("HashAlreadyRegistered");
  }
  const seen = new Set<string>();
  let total = 0;
  wallets.forEach((w, i) => {
    if (/^0x0{40}$/i.test(w)) throw new MockContractError("ZeroAddress");
    if (sharesBps[i] <= 0) throw new MockContractError("ZeroShare");
    if (seen.has(w.toLowerCase())) throw new MockContractError("DuplicateWallet");
    seen.add(w.toLowerCase());
    total += sharesBps[i];
  });
  if (total !== BPS_TOTAL) throw new MockContractError("SharesNot100Percent");

  const contributors: Contributor[] = wallets.map((w, i) => ({
    wallet: getAddress(w),
    role: roles[i],
    shareBps: sharesBps[i],
    confirmed: w.toLowerCase() === sender.toLowerCase(),
  }));
  const confirmedCount = contributors.filter((c) => c.confirmed).length;
  const id = BigInt(s.works.length + 1);
  s.works.push({
    id,
    registrant: getAddress(sender),
    contentHash: input.contentHash,
    title: input.title,
    metadataURI: input.metadataURI,
    registeredAt,
    aiAssisted: input.aiAssisted,
    active: confirmedCount === contributors.length,
    confirmedCount,
    contributorCount: contributors.length,
    totalPaid: 0n,
  });
  s.contributors.push(contributors);
  return id;
}

function workOrThrow(s: State, id: bigint): Work {
  const work = id > 0n ? s.works[Number(id) - 1] : undefined;
  if (!work) throw new MockContractError("WorkNotFound");
  return work;
}

function confirmAll(s: State, id: bigint) {
  const work = workOrThrow(s, id);
  s.contributors[Number(id) - 1].forEach((c) => (c.confirmed = true));
  work.confirmedCount = work.contributorCount;
  work.active = true;
}

function credit(s: State, id: bigint, value: bigint) {
  const work = workOrThrow(s, id);
  const contributors = s.contributors[Number(id) - 1];
  let credited = 0n;
  contributors.forEach((c) => {
    const amount = (value * BigInt(c.shareBps)) / BigInt(BPS_TOTAL);
    credited += amount;
    const key = c.wallet.toLowerCase();
    s.pending[key] = (s.pending[key] ?? 0n) + amount;
  });
  // rounding dust goes to the first contributor, like the real contract
  const first = contributors[0].wallet.toLowerCase();
  s.pending[first] += value - credited;
  work.totalPaid += value;
}

// ---------- public API (mirrors the contract) ----------

const clone = <T,>(v: T): T => structuredClone(v);

export const mockLedger = {
  workCount: (): bigint => BigInt(load().works.length),
  getWork: (id: bigint): Work => clone(workOrThrow(load(), id)),
  getContributors: (id: bigint): Contributor[] => {
    workOrThrow(load(), id);
    return clone(load().contributors[Number(id) - 1]);
  },
  workIdByHash: (hash: Hex): bigint =>
    load().works.find((w) => w.contentHash.toLowerCase() === hash.toLowerCase())?.id ?? 0n,
  pendingWithdrawal: (account: Address): bigint => load().pending[account.toLowerCase()] ?? 0n,

  registerWork(sender: Address, input: RegisterWorkInput): bigint {
    const s = load();
    const id = insert(s, sender, input);
    save();
    return id;
  },
  confirmContribution(sender: Address, id: bigint) {
    const s = load();
    const work = workOrThrow(s, id);
    const me = s.contributors[Number(id) - 1].find((c) => c.wallet.toLowerCase() === sender.toLowerCase());
    if (!me) throw new MockContractError("NotAContributor");
    if (me.confirmed) throw new MockContractError("AlreadyConfirmed");
    me.confirmed = true;
    work.confirmedCount += 1;
    if (work.confirmedCount === work.contributorCount) work.active = true;
    save();
  },
  payWork(_sender: Address, id: bigint, value: bigint) {
    const s = load();
    // The contract reverts WorkNotActive (not WorkNotFound) for unknown ids too.
    const work = id > 0n ? s.works[Number(id) - 1] : undefined;
    if (!work?.active) throw new MockContractError("WorkNotActive");
    if (value <= 0n) throw new MockContractError("ZeroPayment");
    credit(s, id, value);
    save();
  },
  withdraw(sender: Address): bigint {
    const s = load();
    const key = sender.toLowerCase();
    const amount = s.pending[key] ?? 0n;
    if (amount === 0n) throw new MockContractError("NothingToWithdraw");
    s.pending[key] = 0n;
    save();
    return amount;
  },
};

/** Fake tx hash + delays so pending states are visible in the UI. */
export const mockTx = {
  hash: (): Hash => keccak256(toHex(`${Date.now()}-${Math.random()}`)),
  delay: (ms: number) => new Promise((r) => setTimeout(r, ms)),
};
