import { bytesToHex, type Hex } from "viem";

/** SHA-256 of a file computed in the browser, as a bytes32 hex string. */
export async function hashFile(file: File): Promise<Hex> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return bytesToHex(new Uint8Array(digest));
}
