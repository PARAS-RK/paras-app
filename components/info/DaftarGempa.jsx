import { Fragment } from 'react';

export default function DaftarGempa({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((g, i) => (
        <li key={i} className="rounded-xl bg-white/70 p-3 text-xs">
          <p className="text-sm font-black text-foreground">
            Kekuatan {g.magnitudo}, {g.sumber}
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {[
              ['Waktu', g.waktu],
              ['Kedalaman', g.kedalaman],
              ['Potensi tsunami', g.potensi],
            ]
              .filter(([, nilai]) => nilai)
              .map(([label, nilai]) => (
                <Fragment key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-foreground">{nilai}</dd>
                </Fragment>
              ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}