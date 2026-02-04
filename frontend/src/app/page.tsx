import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Portal do Paciente
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Acesse seu plano de cuidados personalizado, agende consultas,
          visualize prescrições e gerencie sua saúde de forma prática e segura.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/login" className="btn-primary">
            Entrar
          </Link>
          <Link href="/register" className="btn-secondary">
            Criar conta
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Plano de Cuidados</h3>
            <p className="text-sm text-gray-600">
              Visualize recomendações personalizadas, serviços e suplementos indicados.
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Agendamento</h3>
            <p className="text-sm text-gray-600">
              Agende consultas de forma rápida e receba confirmações automáticas.
            </p>
          </div>

          <div className="card">
            <div className="text-3xl mb-3">💊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Prescrições</h3>
            <p className="text-sm text-gray-600">
              Acesse suas prescrições e solicite renovações quando elegível.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
