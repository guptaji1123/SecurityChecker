import Card from "../ui/Card";

const features = [
  { icon: "🔑", title: "Detect exposed keys", text: "Find API keys, tokens and passwords hiding in your code." },
  { icon: "⚡", title: "Scan in minutes", text: "Upload your code or paste a repo link and get results fast." },
  { icon: "📋", title: "Clear risk details", text: "Every finding shows its severity and exactly where it is." },
  { icon: "🚀", title: "Ship safer and faster", text: "Follow simple fix steps and release with confidence." },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl py-16">
      <h2 className="mb-10 text-center text-3xl font-bold">Why use it</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title}>
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}