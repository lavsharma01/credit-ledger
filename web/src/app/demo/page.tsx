import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Demo guide · Credit Ledger" };

const STEPS: { time: string; title: string; body: ReactNode }[] = [
  {
    time: "0:00",
    title: "Pitch (landing page)",
    body: (
      <>
        &quot;Creative work is now made by people <i>and</i> AI tools. Credit Ledger records who
        contributed, proves the file existed, and splits every payment automatically.&quot; Point at
        the recent works list and the <b>AI-assisted</b> badges.
      </>
    ),
  },
  {
    time: "0:15",
    title: "Register as the creator (Wallet A)",
    body: (
      <>
        Connected as <b>Wallet A</b>, open <b>Register</b>. Pick any file and show that its SHA-256
        fingerprint is computed in the browser. Enter the title, turn on <b>AI-assisted</b>, then add
        3 contributors: <b>A: Writer 50%</b>, <b>B: Producer 30%</b>, <b>C: AI tool: Suno 20%</b>.
        Point out that the total shows 100% ✓. Click <b>Register work</b> and approve in the wallet.
      </>
    ),
  },
  {
    time: "0:45",
    title: "Show the work page",
    body: (
      <>
        You land on the new work: status <b>Awaiting confirmations 1/3</b> (A was auto-confirmed).
        The pay form is locked until everyone agrees.
      </>
    ),
  },
  {
    time: "1:00",
    title: "Confirm from the other wallets (B, then C)",
    body: (
      <>
        Switch to <b>Wallet B</b> and click <b>Confirm my contribution</b>. Switch to{" "}
        <b>Wallet C (the AI tool wallet)</b>, open <b>Dashboard</b>, and click <b>Confirm</b>{" "}
        under &quot;Waiting for your confirmation&quot;. The work turns <b>Active</b>.
      </>
    ),
  },
  {
    time: "1:25",
    title: "Pay the work (any wallet)",
    body: (
      <>
        On the work page, enter <b>0.01 ETH</b>. The preview shows the split (0.005 / 0.003 /
        0.002). Click <b>Pay</b>, and the toast links to the transaction on Etherscan.
      </>
    ),
  },
  {
    time: "1:45",
    title: "Withdraw (Wallet B)",
    body: (
      <>
        Switch to <b>Wallet B</b>, open <b>Dashboard</b>: pending earnings show 0.003 ETH. Click{" "}
        <b>Withdraw</b>. Close with the <b>Verify a file</b> box: upload the original file for a
        ✓ Match, then any other file for ✕ No match.
      </>
    ),
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Demo guide</h1>
        <p className="text-stone-600">
          A 2-minute walkthrough of register, confirm, pay and withdraw, using three wallets:
          the creator (A), a human collaborator (B) and an AI tool&apos;s wallet (C).
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Before you start</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-stone-700">
          <li>
            <b>Mock mode</b> (no deployment, no MetaMask): set <Code>NEXT_PUBLIC_USE_MOCK=true</Code>{" "}
            in <Code>web/.env.local</Code> and run <Code>npm run dev</Code>. Use{" "}
            <b>Connect wallet → Mock: Alice / Bob / AI tool wallet</b> as wallets A / B / C.
            &quot;Reset demo data&quot; in the yellow banner starts over.
          </li>
          <li>
            <b>Sepolia</b>: set <Code>NEXT_PUBLIC_USE_MOCK=false</Code> (the address comes from{" "}
            <Code>shared/deployments.json</Code>). In MetaMask create 3 accounts, add them as A / B / C,
            and fund all three with a little Sepolia ETH (each one pays gas for its own confirm or
            withdraw). Switch accounts in MetaMask between steps; the app follows automatically.
          </li>
          <li>
            Before going on stage, copy the three addresses into a note so you can paste them into the
            register form.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Click path</h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex w-12 shrink-0 flex-col items-center">
                <span className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                  {i + 1}
                </span>
                <span className="mt-1 text-xs tabular-nums text-stone-500">{step.time}</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-stone-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">{children}</code>;
}
