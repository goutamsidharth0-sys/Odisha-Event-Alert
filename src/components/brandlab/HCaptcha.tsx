"use client";

import React from "react";

// hCaptcha on the phone-capture step only (§9). Everything before this point is
// free to the visitor and free to us, so there is nothing worth gating.
//
// Renders nothing at all when NEXT_PUBLIC_HCAPTCHA_SITEKEY is unset — the flow
// works without it in development and on a fresh deploy.

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          theme?: string;
        }
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;
const SCRIPT_ID = "hcaptcha-api";

interface Props {
  onToken: (token: string | undefined) => void;
  className?: string;
}

export default function HCaptcha({ onToken, className }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const widget = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!SITEKEY || !ref.current) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !ref.current || widget.current || !window.hcaptcha) return;
      widget.current = window.hcaptcha.render(ref.current, {
        sitekey: SITEKEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(undefined),
      });
    };

    if (window.hcaptcha) {
      mount();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", mount);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", mount);
    };
  }, [onToken]);

  if (!SITEKEY) return null;
  return <div ref={ref} className={className} />;
}
