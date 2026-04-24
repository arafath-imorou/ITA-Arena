import Hero from "@/components/Home/Hero/Hero";
import SubNav from "@/components/Home/SubNav/SubNav";
import FeaturedEvents from "@/components/Home/FeaturedEvents/FeaturedEvents";

export default function Home() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <main className="animate-in">
        <Hero />
        <SubNav />
        <FeaturedEvents />

        {/* Secondary CTA - Stylized to match mockup aesthetic */}
        <section style={{
          padding: '6rem 0',
          background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
          borderTop: '1px solid #f3f4f6',
          textAlign: 'center'
        }} className="animate-in">
          <div className="container">
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              fontFamily: 'var(--font-heading)',
              color: '#1A1A1A',
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em'
            }}>
              Vendez vos billets en quelques clics
            </h2>
            <p style={{
              color: '#666',
              fontSize: '1.2rem',
              maxWidth: '700px',
              margin: '0 auto 3rem',
              lineHeight: 1.7
            }}>
              Rejoignez plus de 500 organisateurs qui font confiance à ITA Arena pour la gestion de leurs événements premium.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary">
                🚀 Commencer maintenant
              </button>
              <button className="btn btn-outline">
                En savoir plus
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
