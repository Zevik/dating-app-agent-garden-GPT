import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center gap-8 py-24 px-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">ברוכים הבאים לג׳ארדן דייטינג</h1>
        <p className="text-lg text-gray-700">
          הכירו התאמות משמעותיות בשיחה המודרכת על ידי סוכני Agent Garden. התהליך בטוח, נעים ומדויק – התאמה אחת בכל פעם.
        </p>
      </div>
      <div className="flex flex-row gap-4">
        <Link className="btn-primary" href="/register">פתח חשבון חדש</Link>
        <Link className="btn-secondary" href="/login">כבר יש לי חשבון</Link>
      </div>
    </main>
  );
}
