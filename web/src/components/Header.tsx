import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

const NAV = [
  { href: "/", label: "Works" },
  { href: "/register", label: "Register" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/demo", label: "Demo guide" },
];

export function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Credit<span className="text-indigo-600">Ledger</span>
        </Link>
        <nav className="flex gap-4 text-sm text-stone-600">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-stone-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
