import React from 'react'
import Link from 'next/link'
const Header = ({ title, href }) => (
  <div className="mx-auto mt-12 mb-2 flex max-w-7xl items-end justify-between px-4">
    <div>
      <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
      <div className="mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"></div>
    </div>
    {href && (<Link href={href} className="text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300">Lihat Semua →</Link>)}
  </div>
)
export default Header
