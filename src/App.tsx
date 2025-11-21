import WeddingForm from '@/components/WeddingForm'

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="hero__eyebrow">Nuestra boda</p>
        <h1 className="hero__title">Lucía y Andrés</h1>
        <p className="hero__subtitle" aria-hidden="true" />
      </header>

      <section className="card-grid card-grid--single">
        <article className="form-card">
          <WeddingForm />
        </article>
      </section>
    </div >
  )
}

export default App
