import Link from "next/link";

export default function Rodape() {
  return (
    <footer className="rodape">
      <nav>
        <Link href="/">Início</Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos</Link>
      </nav>
      <p>Feito para fins de diversão. Resultados gerados por inteligência artificial.</p>
    </footer>
  );
}
