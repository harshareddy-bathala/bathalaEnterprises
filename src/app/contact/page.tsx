import ContactForm from "@/components/contact-form";

export const metadata = {
  title: "Contact | Bathala Enterprises"
};

export default function ContactPage() {
  return (
    <div className="container-wide space-y-10">
      <header className="space-y-2 pt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Contact</p>
        <h1 className="text-4xl font-black text-slate-900">Connect with our team</h1>
        <p className="text-slateInk">Tell us about your project and timeline. We respond within one business day.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ContactForm />
        <div className="glass-panel rounded-3xl p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-royal">Visit</p>
          <h3 className="text-xl font-black text-slate-900">Head office</h3>
          <p className="text-slateInk">Chikkapatre Main Road, 5th Cross, Basapura, Bangalore 560100</p>
          <div className="mt-4 overflow-hidden rounded-2xl">
            <iframe
              title="Bathala HQ"
              src="https://maps.google.com/maps?q=basapura,bangalore&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-72 w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}