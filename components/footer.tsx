import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Navegar</h3>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inicio</Link>
              <Link href="/filmes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Filmes</Link>
              <Link href="/series" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Series</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Categorias</h3>
            <div className="flex flex-col gap-2">
              <Link href="/filmes?genre=28" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Acao</Link>
              <Link href="/filmes?genre=35" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comedia</Link>
              <Link href="/filmes?genre=27" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terror</Link>
              <Link href="/filmes?genre=18" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Drama</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Sobre</h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Yure Flix</span>
              <span className="text-sm text-muted-foreground">Plataforma de streaming</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Legal</h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Termos de uso</span>
              <span className="text-sm text-muted-foreground">Privacidade</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Yure Flix - Dados fornecidos por TMDB. Este produto usa a API do TMDB mas nao e endossado ou certificado pelo TMDB.
          </p>
        </div>
      </div>
    </footer>
  )
}
