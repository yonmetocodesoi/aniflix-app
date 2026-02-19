import { getTVGenres } from "@/lib/tmdb"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrowseContent } from "@/components/browse-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "TV - Yure Flix",
    description: "Descubra os melhores programas de TV.",
}

export default async function TVPage() {
    const { genres } = await getTVGenres()

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20 px-4 md:px-12 pb-10">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">TV</h1>
                <BrowseContent
                    genres={genres}
                    defaultApiType="discover_tv"
                    mediaType="tv"
                />
            </div>
            <Footer />
        </main>
    )
}
