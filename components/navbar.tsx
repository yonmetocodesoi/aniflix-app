"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, Menu, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (searchQuery.trim()) {
        router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)
        setSearchOpen(false)
        setSearchQuery("")
      }
    },
    [searchQuery, router]
  )

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/filmes", label: "Filmes" },
    { href: "/series", label: "Series" },
    { href: "/animes", label: "Animes" },
    { href: "/tv", label: "TV" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/20" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}
    >
      <nav className="flex items-center justify-between px-4 md:px-12 py-3">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-primary">
            YURE FLIX
          </h1>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 ml-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${pathname === link.href ? "text-foreground" : "text-muted-foreground"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar filmes, series..."
                  className="w-40 md:w-64 bg-secondary/80 border border-border text-foreground text-sm rounded-sm px-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery("") }}
                  className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar busca"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Abrir busca"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border px-4 py-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium transition-colors ${pathname === link.href ? "text-foreground" : "text-muted-foreground"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
