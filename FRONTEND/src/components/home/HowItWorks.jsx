const steps = [
  { title: "Upload", text: "Add your code or paste a public repo link." },
  { title: "Scan", text: "We check every file for exposed secrets." },
  { title: "Fix", text: "Follow the simple steps to secure each one." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl py-16">
      <h2 className="mb-10 text-center text-3xl font-bold">How it works</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl font-bold text-ink">
              {i + 1}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}