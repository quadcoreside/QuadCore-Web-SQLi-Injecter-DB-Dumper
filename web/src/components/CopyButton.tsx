import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label,
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard blocked — fail silently */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy to clipboard"
      className={`btn btn-ghost !px-2 !py-1 ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-good" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label && <span className="text-xs">{copied ? "Copied" : label}</span>}
    </button>
  );
}
