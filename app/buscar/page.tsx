import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SearchResults } from "@/components/search-results"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buscar - Yure Flix",
  description: "Busque filmes e series.",
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q || ""

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 md:px-12 pb-10">
        {query ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Resultados para: <span className="text-primary">{`"${query}"`}</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Mostrando resultados de filmes e series.
            </p>
            <SearchResults query={query} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-bold text-foreground mb-3">Buscar</h1>
            <p className="text-muted-foreground text-center">
              Use a barra de busca acima para encontrar filmes e series.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
