import SubNav from "@/components/Home/SubNav/SubNav";
import FeaturedEvents from "@/components/Home/FeaturedEvents/FeaturedEvents";
export default function Home() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <SubNav />
      <FeaturedEvents />

      {/* Secondary CTA - Stylized to match mockup aesthetic */}
      <section style={{
        padding: '5rem 0',
        background: '#f8f9fa',
        borderTop: '1px solid #efefef',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: '#1A1A1A',
            marginBottom: '1rem'
          }}>
            Vendez vos billets en quelques clics
          </h2>
          <p style={{
            color: '#666',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            Rejoignez plus de 500 organisateurs qui font confiance à ITA Arena pour la gestion de leurs événements premium.
          </p>
          <button style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            padding: '1rem 2.5rem',
            borderRadius: '50px',
            border: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 15px rgba(255, 90, 31, 0.2)'
          }}>
            Commencer maintenant
          </button>
        </div>
      </section>
    </div>
  );
}
