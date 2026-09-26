import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CONTRACT_ADDRESS, CONTRACT_URL, TARGET_CHAIN, USE_MOCK } from "@/config/env";

export const metadata: Metadata = { title: "Demo guide · Credit Ledger" };

const STEPS: { time: string; who: string; title: string; body: ReactNode }[] = [
  {
    time: "0:00",
    who: "Presenter",
    title: "Pitch (landing page)",
    body: (
      <>
        &quot;Credit Ledger records who made a work, human or AI, proves it existed at a time, and
        splits payments automatically.&quot; Point at the testnet banner and the recent works list.
      </>
    ),
  },
  {
    time: "0:15",
    who: "Alice",
    title: "Register the work",
    body: (
      <>
        Open <b>Register</b> and choose the <b>fresh demo file</b>. The SHA-256 fingerprint is
        computed in the browser. Enter the title &quot;Demo Song&quot;, turn on <b>AI-assisted</b>,
        and add contributors <b>Alice: Writer 50%</b>, <b>Bob: Producer 30%</b>,{" "}
        <b>AI tool wallet: &quot;AI tool: Suno&quot; 20%</b>. The total shows 100% ✓. Click{" "}
        <b>Register work</b>, then <b>Confirm</b> in MetaMask. After about 15 s you land on the work
        page showing <b>Awaiting confirmations 1/3</b>, because Alice is auto-confirmed.
      </>
    ),
  },
  {
    time: "0:40",
    who: "Bob",
    title: "Bob confirms",
    body: (
      <>
        In MetaMask, switch the account to <b>Bob</b>; the app follows automatically. On the work
        page click <b>Confirm my contribution</b>, then <b>Confirm</b> in MetaMask. The status
        becomes 2/3.
      </>
    ),
  },
  {
    time: "0:55",
    who: "AI tool wallet",
    title: "The AI tool's wallet confirms",
    body: (
      <>
        Switch MetaMask to the <b>AI tool</b> account. Confirm from the work page or from{" "}
        <b>Dashboard → Waiting for your confirmation</b>. The status turns <b>Active</b>.
      </>
    ),
  },
  {
    time: "1:10",
    who: "Alice (or anyone)",
    title: "Pay 0.001 ETH",
    body: (
      <>
        On the work page, type <b>0.001</b>. The split preview shows Alice 0.0005, Bob 0.0003 and AI
        tool 0.0002 ETH. Click <b>Pay</b> and confirm in MetaMask. The toast links to the
        transaction on Etherscan.
      </>
    ),
  },
  {
    time: "1:25",
    who: "Bob",
    title: "Bob withdraws",
    body: (
      <>
        Switch to <b>Bob</b> and open <b>Dashboard</b>: pending earnings show <b>0.0003 ETH</b>.
        Click <b>Withdraw</b> and confirm in MetaMask. Pending goes to 0.
      </>
    ),
  },
  {
    time: "1:40",
    who: "Presenter",
    title: "Show the public record",
    body: (
      <>
        Open the toast&apos;s <b>View on explorer</b> link and point at the{" "}
        <code>PaymentReceived</code> and <code>Withdrawn</code> events.
      </>
    ),
  },
  {
    time: "1:50",
    who: "Presenter",
    title: "Verify a file and close",
    body: (
      <>
        On the work page, drop the original file into <b>Verify a file</b> (✓ Match), then another
        file (✕ No match). Close with: &quot;This is a testnet prototype. It proves a file hash and
        its credited split existed at a time, not that the people credited actually made it.&quot;
      </>
    ),
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">Demo guide</h1>
        <p className="text-stone-600">
          A 2-minute walkthrough of register, confirm, pay and withdraw on {TARGET_CHAIN.name}, using
          three wallets: <b>Alice</b> (creator), <b>Bob</b> (human collaborator) and the{" "}
          <b>AI tool wallet</b>.
        </p>
        <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <b>Testnet prototype.</b> The contract is unaudited and runs on the Sepolia testnet with free
          test ETH. Never use it with real funds.
          {CONTRACT_URL && CONTRACT_ADDRESS && (
            <>
              {" "}
              Contract:{" "}
              <a href={CONTRACT_URL} target="_blank" rel="noreferrer" className="break-all font-mono underline">
                {CONTRACT_ADDRESS} ↗
              </a>
            </>
          )}
        </p>
        {USE_MOCK && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            You are in <b>mock mode</b> right now: nothing here is on-chain. Say so if you present from
            this mode.
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Before you go on stage</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
          <li>
            In MetaMask, create three accounts named <b>Alice</b>, <b>Bob</b> and <b>AI tool</b>, and
            keep their addresses in a note to paste into the register form.
          </li>
          <li>
            Fund <b>each</b> account with about 0.01 Sepolia ETH from a faucet. Every account pays gas
            for its own action, including the AI tool wallet (confirm) and Bob (withdraw). If the faucet
            is rate-limited, fund Alice and send some on to the others.
          </li>
          <li>
            Prepare a <b>fresh demo file</b>. A file can only be registered once, so every rehearsal
            uses one up. Keep a few copies with one character changed, and one untouched for the live
            run.
          </li>
          <li>
            Open the app with <Code>NEXT_PUBLIC_USE_MOCK=false</Code> and MetaMask on Sepolia. If
            the red banner appears, click <b>Switch to Sepolia</b>. Keep an Etherscan tab open on the
            contract.
          </li>
        </ol>
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
                <h3 className="font-medium">
                  {step.title} <span className="text-sm font-normal text-stone-500">· {step.who}</span>
                </h3>
                <p className="text-sm text-stone-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">If something fails</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-stone-700">
          <li>
            <b>RPC slow or failing:</b> set <Code>NEXT_PUBLIC_RPC_URL</Code> to another Sepolia
            provider and reload. The app already falls back across public RPCs.
          </li>
          <li>
            <b>Out of test ETH:</b> use a spare pre-funded account; never rely on a faucet on stage.
          </li>
          <li>
            <b>Wallet trouble:</b> switch to <b>mock mode</b> (the fallback deployment, or{" "}
            <Code>NEXT_PUBLIC_USE_MOCK=true</Code> locally). It runs the same flow with &quot;Mock:
            Alice / Bob / AI tool wallet&quot;. Tell the audience it is mock mode.
          </li>
          <li>
            <b>Everything fails:</b> play the recorded Sepolia run and show an earlier work&apos;s
            transactions on Etherscan.
          </li>
        </ul>
      </section>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">{children}</code>;
}
