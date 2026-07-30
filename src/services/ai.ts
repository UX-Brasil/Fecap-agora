// Mock AI assistant. Answers pattern-matched, contextual questions using our seed data.
// When Supabase + OpenAI are wired later, replace `respond` with a real API call.

import { COMPANIES, EVENTS, JOBS, USERS, companyById } from "./mock-data";
import { pathToCompany } from "./graph";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function respond(userMessage: string, currentUserId: string = "u_me"): string {
  const m = norm(userMessage);

  // "Quero trabalhar na [Empresa]"
  for (const c of COMPANIES) {
    if (m.includes(norm(c.name))) {
      const path = pathToCompany(currentUserId, c.id);
      const jobsHere = JOBS.filter((j) => j.companyId === c.id);
      const eventsHere = EVENTS.filter((e) => e.companyId === c.id);
      const alumni = USERS.filter((u) => u.companyCurrent === c.id);
      const partnerHint = c.isFecapPartner
        ? "• Esta empresa é parceira da FECAP, o que reforça sua visibilidade nas recomendações sem garantir contratação."
        : "";
      const lines = [
        `Ótimo! Aqui está o que encontrei sobre **${c.name}**:`,
        "",
        path ? `• Você está a **${path.path.length - 1} conexões** de ${path.targetUser.name} (${c.name}).` : "• Ainda não achei um caminho direto até um funcionário — vamos criar!",
        `• ${alumni.length} ex-alunos FECAP trabalham lá hoje.`,
        partnerHint,
        `• ${jobsHere.length} vagas ativas para você.`,
        `• ${eventsHere.length} evento(s) próximo(s) da empresa.`,
        "",
        "Quer que eu solicite uma apresentação ou mostre as vagas?",
      ];
      return lines.join("\n");
    }
  }

  if (m.includes("parceiro") || m.includes("fecap") || m.includes("parceria")) {
    const partners = COMPANIES.filter((c) => c.isFecapPartner).slice(0, 5);
    if (partners.length) {
      return `A rede de parceiros FECAP destacada na plataforma inclui: ${partners.map((c) => c.name).join(", ")}. Eles recebem reforço de relevância nas recomendações, mas isso não garante contratação.`;
    }
  }

  // "vagas" / "match"
  if (m.includes("vaga") || m.includes("match") || m.includes("emprego")) {
    const top = [...JOBS].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
    const lines = ["Seus 3 melhores matches agora são:", ""];
    top.forEach((j, i) => {
      const co = companyById(j.companyId);
      lines.push(`${i + 1}. **${j.title}** — ${co?.name} (${j.matchScore}% match)`);
    });
    lines.push("", "Abra a aba **Match** para dar swipe. 🔥");
    return lines.join("\n");
  }

  // "hackathon"
  if (m.includes("hackathon")) {
    const upcoming = EVENTS.filter((e) => e.kind === "hackathon");
    return `Encontrei ${upcoming.length} hackathon(s) próximo(s). O mais popular: **${upcoming[0]?.title}** em ${upcoming[0] ? new Date(upcoming[0].date).toLocaleDateString("pt-BR") : "-"}.`;
  }

  // "mentoria"
  if (m.includes("mentor")) {
    const mentors = USERS.filter((u) => u.role === "alumni");
    return `Temos ${mentors.length} ex-alunos disponíveis para mentoria. Sugiro começar por **${mentors[0].name}** (${companyById(mentors[0].companyCurrent!)?.name}).`;
  }

  // "conexao" / "network"
  if (m.includes("conex") || m.includes("network") || m.includes("rede")) {
    return "Sua rede tem 5 conexões diretas e ~11 pessoas no 2º grau. Abra a aba **Rede** para visualizar o grafo interativo.";
  }

  // default
  return "Sou o assistente ASA. Posso ajudar com:\n\n• **Empresas** — Ex: \"Quero trabalhar na IBM\"\n• **Vagas** — Ex: \"Me mostre matches\"\n• **Hackathons** e eventos\n• **Mentorias** com ex-alunos\n• **Rede** de conexões\n\nO que você quer explorar?";
}

export const STARTER_PROMPTS = [
  "Quero trabalhar no Nubank",
  "Mostre meus melhores matches",
  "Quais hackathons rolando?",
  "Encontre um mentor pra mim",
];
