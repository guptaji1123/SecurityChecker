import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Find leaked secrets in <span className="text-accent">5 minutes</span>
        </h1>
        <p className="mt-6 text-lg text-muted">
          Upload your code or paste a public repo link and get a clear report of
          exposed keys, with simple steps to fix each one.
        </p>
        <div className="mt-10">
          <Button to="/scan">Scan now</Button>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Badge severity="critical" />
          <Badge severity="high" />
          <Badge severity="medium" />
          <Badge severity="low" />
        </div>
      </section>

      <Features />
      <HowItWorks />

      <section className="mx-auto max-w-3xl py-16 text-center">
        <h2 className="text-3xl font-bold">Ready to check your code?</h2>
        <p className="mt-4 text-muted">It takes about five minutes.</p>
        <div className="mt-8">
          <Button to="/scan">Scan now</Button>
        </div>
      </section>
    </>
  );
}