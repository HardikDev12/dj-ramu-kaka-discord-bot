'use client';

import Image from 'next/image';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="overflow-hidden bg-[#0e0e0e] text-white">
      <main className="flex min-h-screen w-full flex-col lg:flex-row">
        <section className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-black px-12">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ffa84f]/10 via-transparent to-[#fdd400]/10 opacity-30" />
          <div className="z-10 max-w-xl px-4 text-center">
            <Image
              src="/brand/logo-transparent.png"
              alt="DJ RAMU KAKA Brand Logo"
              width={128}
              height={128}
              className="mx-auto mb-8 h-32 w-32 object-contain drop-shadow-[0_0_30px_rgba(255,168,79,0.4)]"
            />
            <h1 className="font-display text-5xl font-black leading-none tracking-tight text-white">
              JOIN THE <span className="bg-gradient-to-r from-[#ffa84f] to-[#fdd400] bg-clip-text text-transparent">SOUNDSTAGE</span>
            </h1>
            <p className="mb-12 mt-4 text-lg leading-relaxed text-[#adaaaa]">
              Experience the next generation of digital audio. Elevate your Discord server with high-octane performance and seamless control.
            </p>
            <div className="flex h-24 items-end justify-center gap-1" aria-hidden>
              {[12, 20, 16, 24, 10, 22, 14, 18, 12, 8, 20, 15, 24, 12, 18].map((h, i) => (
                <div
                  key={`${h}-${i}`}
                  className="w-1 rounded-sm bg-gradient-to-t from-[#ffa84f] to-[#fdd400]"
                  style={{ height: `${h * 4}px` }}
                />
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-10 left-10 select-none opacity-5">
            <span className="font-display block text-[120px] font-black leading-none">ELECTRO</span>
            <span className="-mt-8 font-display block text-[120px] font-black leading-none">MASALA</span>
          </div>
        </section>

        <section className="relative flex w-full lg:w-1/2 flex-col items-center justify-center bg-[#0e0e0e] px-6 py-10 md:px-16 lg:px-24">
          <div className="mb-10 w-full max-w-md">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <Image src="/brand/logo-transparent.png" alt="DJ RAMU KAKA Brand Logo" width={48} height={48} className="h-12 w-12 object-contain" />
              <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-[#ffa84f] to-[#fdd400] bg-clip-text text-transparent">
                DJ RAMU KAKA
              </span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-[#adaaaa]">{subtitle}</p> : null}
          </div>
          <div className="w-full max-w-md">{children}</div>
          {footer ? <div className="mt-8 w-full max-w-md">{footer}</div> : null}
        </section>
      </main>
    </div>
  );
}
