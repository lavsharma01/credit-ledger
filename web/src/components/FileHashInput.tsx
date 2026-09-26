"use client";

import { useId, useState } from "react";
import type { Hex } from "viem";
import { hashFile } from "@/lib/hash";
import { Spinner } from "./ui";

/** File picker that computes the file's SHA-256 (bytes32) locally. The file never leaves the browser. */
export function FileHashInput({
  onHash,
  hint = "The file stays on your device; only its SHA-256 fingerprint is used.",
}: {
  onHash: (hash: Hex | undefined, file: File | undefined) => void;
  hint?: string;
}) {
  const inputId = useId();
  const [file, setFile] = useState<File>();
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState<string>();

  const onChange = async (selected: File | undefined) => {
    setFile(selected);
    setError(undefined);
    onHash(undefined, selected);
    if (!selected) return;
    setHashing(true);
    try {
      onHash(await hashFile(selected), selected);
    } catch {
      setError("Couldn't read that file. Try another one.");
    } finally {
      setHashing(false);
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm hover:border-indigo-400 hover:bg-indigo-50/40"
      >
        {file ? (
          <span className="font-medium text-stone-800">
            {file.name}{" "}
            <span className="font-normal text-stone-500">({(file.size / 1024).toFixed(1)} KB)</span>
          </span>
        ) : (
          <span className="font-medium text-stone-700">Choose a file</span>
        )}
        <span className="text-xs text-stone-500">
          {hashing ? (
            <>
              <Spinner /> Computing fingerprint…
            </>
          ) : file ? (
            "Click to choose a different file"
          ) : (
            hint
          )}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
