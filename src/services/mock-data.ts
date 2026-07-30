import {
  Company,
  Connection,
  Event,
  FeedPost,
  JobOpportunity,
  Notification,
  StoryItem,
  UserProfile,
} from "@/src/types";

import { fecapPartnerCompanies } from "./fecap-partners";
import { sortCompaniesForFecap } from "./recommendation";

const now = Date.now();

const iso = (offsetMs: number) =>
  new Date(now + offsetMs).toISOString();

const hours = (n: number) => n * 60 * 60 * 1000;
const days = (n: number) => n * 24 * hours(1);

/**
 * Algumas versões da interface Company utilizam `logo`,
 * enquanto outras partes do sistema esperam `logoUrl`.
 *
 * Este tipo auxiliar permite normalizar os dois campos.
 */
type CompanyWithLogo = Company & {
  logo?: string;
  logoUrl?: string;
};

/**
 * Remove acentos, espaços e caracteres especiais para permitir
 * a comparação entre nomes como:
 *
 * - Itaú
 * - Itau
 * - Itaú Unibanco
 */
const normalizeCompanyValue = (value?: string): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^c_/, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Nomes diferentes que representam a mesma empresa.
 */
const COMPANY_NAME_ALIASES: Record<string, string> = {
  itau: "itauunibanco",
  bancoitau: "itauunibanco",
  itauunibanco: "itauunibanco",

  googlebrasil: "google",
  googlellc: "google",

  deloittebrasil: "deloitte",

  pwcbrasil: "pwc",
  pricewaterhousecoopers: "pwc",

  youngandrubicam: "yr",
  yandr: "yr",

  jtw: "jwt",
};

const getCanonicalCompanyKey = (value?: string): string => {
  const normalized = normalizeCompanyValue(value);

  return COMPANY_NAME_ALIASES[normalized] ?? normalized;
};

/**
 * Retorna a URL de logo disponível na empresa.
 *
 * A prioridade é:
 * 1. logoUrl;
 * 2. logo;
 * 3. string vazia.
 */
const getCompanyLogo = (
  company?: CompanyWithLogo | null,
): string => {
  if (!company) {
    return "";
  }

  return company.logoUrl ?? company.logo ?? "";
};

/**
 * Índices das empresas parceiras para busca rápida por ID e nome.
 */
const fecapPartnerById = new Map<string, CompanyWithLogo>();
const fecapPartnerByName = new Map<string, CompanyWithLogo>();

fecapPartnerCompanies.forEach((company) => {
  const partner = company as CompanyWithLogo;

  fecapPartnerById.set(
    getCanonicalCompanyKey(partner.id),
    partner,
  );

  fecapPartnerByName.set(
    getCanonicalCompanyKey(partner.name),
    partner,
  );
});

/**
 * Procura uma empresa parceira equivalente à empresa recebida.
 *
 * Primeiro procura pelo ID e depois pelo nome.
 */
const findFecapPartner = (
  company: CompanyWithLogo,
): CompanyWithLogo | undefined => {
  const idKey = getCanonicalCompanyKey(company.id);
  const nameKey = getCanonicalCompanyKey(company.name);

  return (
    fecapPartnerById.get(idKey) ??
    fecapPartnerByName.get(nameKey)
  );
};

/**
 * Garante que toda empresa exposta pelo mock-data possua logoUrl.
 */
const normalizeCompanyLogo = (
  company: CompanyWithLogo,
): Company => {
  const logoUrl = getCompanyLogo(company);

  return {
    ...company,
    logo: logoUrl,
    logoUrl,
  } as Company;
};

// ============ COMPANIES ============

/**
 * Empresas já utilizadas pelos mocks de vagas, eventos,
 * usuários, stories e conexões.
 *
 * Os IDs devem ser mantidos porque são referenciados em outras
 * entidades do sistema.
 */
const baseCompanies: CompanyWithLogo[] = [
  {
    id: "c_ibm",
    name: "IBM",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
    industry: "Tecnologia",
    description: "Líder global em cloud, IA e consultoria empresarial.",
    employeesCount: 288000,
    alumniCount: 47,
    color: "#0530AD",
  },
  {
    id: "c_microsoft",
    name: "Microsoft",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1200",
    industry: "Tecnologia",
    description: "Empresa de software, cloud (Azure) e produtividade.",
    employeesCount: 221000,
    alumniCount: 62,
    color: "#00A4EF",
  },
  {
    id: "c_sap",
    name: "SAP",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200",
    industry: "Enterprise Software",
    description: "Referência mundial em ERPs e soluções corporativas.",
    employeesCount: 107000,
    alumniCount: 33,
    color: "#0FAAFF",
  },
  {
    id: "c_deloitte",
    name: "Deloitte",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/15/Deloitte.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200",
    industry: "Consultoria",
    description: "Big Four em auditoria, consultoria e advisory.",
    employeesCount: 415000,
    alumniCount: 89,
    color: "#86BC25",
  },
  {
    id: "c_nubank",
    name: "Nubank",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200",
    industry: "Fintech",
    description: "Maior banco digital independente da América Latina.",
    employeesCount: 8100,
    alumniCount: 54,
    color: "#820AD1",
  },
  {
    id: "c_google",
    name: "Google",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=1200",
    industry: "Tecnologia",
    description: "Buscador, cloud (GCP), AI e produtos digitais.",
    employeesCount: 182000,
    alumniCount: 41,
    color: "#4285F4",
  },
  {
    id: "c_itau",
    name: "Itaú",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Ita%C3%BA_Unibanco_logo_2023.svg",
    coverUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200",
    industry: "Banco",
    description: "Maior banco privado da América Latina.",
    employeesCount: 100000,
    alumniCount: 118,
    color: "#EC7000",
  },
  {
    id: "c_ambev",
    name: "Ambev",
    logoUrl:
      "https://images.seeklogo.com/logo-png/20/1/ambev-logo-png_seeklogo-204550.png",
    coverUrl:
      "https://images.seeklogo.com/logo-png/20/1/ambev-logo-png_seeklogo-204550.png",
    industry: "Bebidas",
    description: "Maior cervejaria do Brasil e uma das maiores do mundo.",
    employeesCount: 32000,
    alumniCount: 76,
    color: "#F5B301",
  },
  {
    id: "c_xp",
    name: "XP Inc.",
    logoUrl:
      "https://cdn.worldvectorlogo.com/logos/xp-investimento-logo.svg",
    coverUrl:
      "https://cdn.worldvectorlogo.com/logos/xp-investimento-logo.svg",
    industry: "Investimentos",
    description: "Plataforma líder de investimentos no Brasil.",
    employeesCount: 7300,
    alumniCount: 44,
    color: "#000000",
  },
  {
    id: "c_btg",
    name: "BTG Pactual",
    logoUrl:
      "https://play-lh.googleusercontent.com/0nMkJ_N7K4GgS705ru8rpbHhrr29w_HxUc_BgoXdNx37gonq51qzoVO_sEjG_TlxHQ4av0jSy1PaJa4bVyVf",
    coverUrl:
      "https://play-lh.googleusercontent.com/0nMkJ_N7K4GgS705ru8rpbHhrr29w_HxUc_BgoXdNx37gonq51qzoVO_sEjG_TlxHQ4av0jSy1PaJa4bVyVf",
    industry: "Banco de Investimento",
    description: "Maior banco de investimento da América Latina.",
    employeesCount: 6100,
    alumniCount: 29,
    color: "#003C71",
  },
];

/**
 * IDs dos parceiros que já foram incorporados às empresas-base.
 *
 * Exemplo:
 * - Google de fecap-partners vira c_google;
 * - Deloitte de fecap-partners vira c_deloitte;
 * - Itaú Unibanco de fecap-partners vira c_itau.
 */
const incorporatedPartnerIds = new Set<string>();

/**
 * Mescla as informações da empresa-base com os dados da parceria.
 *
 * O ID da empresa-base é preservado para não quebrar:
 * - jobs;
 * - stories;
 * - eventos;
 * - usuários;
 * - conexões;
 * - rotas dinâmicas.
 *
 * A logo da empresa parceira tem prioridade.
 */
const companiesWithPartnerData = baseCompanies.map(
  (baseCompany): Company => {
    const partner = findFecapPartner(baseCompany);

    if (!partner) {
      return normalizeCompanyLogo(baseCompany);
    }

    incorporatedPartnerIds.add(partner.id);

    const partnerLogo = getCompanyLogo(partner);
    const baseLogo = getCompanyLogo(baseCompany);
    const finalLogo = partnerLogo || baseLogo;

    return normalizeCompanyLogo({
      ...partner,
      ...baseCompany,

      // O ID utilizado pelos mocks precisa ser preservado.
      id: baseCompany.id,

      // O nome existente também é preservado para a interface.
      name: baseCompany.name,

      // Os dados visuais da empresa-base são mantidos.
      coverUrl:
        baseCompany.coverUrl ?? partner.coverUrl,

      color:
        baseCompany.color ??
        partner.color ??
        "#2563EB",

      // A logo da FECAP tem prioridade.
      logo: finalLogo,
      logoUrl: finalLogo,

      // Preserva os números mais completos do mock atual.
      employeesCount:
        baseCompany.employeesCount ??
        partner.employeesCount ??
        0,

      alumniCount:
        baseCompany.alumniCount ??
        partner.alumniCount ??
        0,

      // Mantém todos os metadados da parceria.
      isFecapPartner: true,
      partnershipType:
        partner.partnershipType ?? "institutional",
      recommendationBoost:
        partner.recommendationBoost ?? 20,
      tags: partner.tags ?? ["FECAP"],
    });
  },
);

/**
 * Adiciona os parceiros que ainda não existiam no baseCompanies.
 */
const additionalFecapPartners: Company[] =
  fecapPartnerCompanies
    .filter(
      (partner) =>
        !incorporatedPartnerIds.has(partner.id),
    )
    .map((partner) => {
      const company = partner as CompanyWithLogo;
      const logoUrl = getCompanyLogo(company);

      return normalizeCompanyLogo({
        ...company,
        logo: logoUrl,
        logoUrl,
        employeesCount:
          company.employeesCount ?? 0,
        alumniCount:
          company.alumniCount ?? 0,
        color: company.color ?? "#2563EB",
        isFecapPartner: true,
        partnershipType:
          company.partnershipType ?? "institutional",
        recommendationBoost:
          company.recommendationBoost ?? 20,
        tags: company.tags ?? ["FECAP"],
      });
    });

/**
 * Remove duplicações por ID e por nome canônico.
 */
const removeDuplicateCompanies = (
  companies: Company[],
): Company[] => {
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  return companies.filter((company) => {
    const idKey = getCanonicalCompanyKey(company.id);
    const nameKey = getCanonicalCompanyKey(company.name);

    if (
      usedIds.has(idKey) ||
      usedNames.has(nameKey)
    ) {
      return false;
    }

    usedIds.add(idKey);
    usedNames.add(nameKey);

    return true;
  });
};

const mergedCompanies = removeDuplicateCompanies(
  sortCompaniesForFecap([
    ...companiesWithPartnerData,
    ...additionalFecapPartners,
  ]),
);

export const COMPANIES: Company[] =
  mergedCompanies;

// ============ STORIES (24h expiring) ============

export const STORIES: StoryItem[] = [
  {
    id: "s1",
    companyId: "c_ibm",
    mediaUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    type: "hackathon",
    title: "IBM Call for Code 2026",
    subtitle: "Inscrições abertas",
    ctaLabel: "Participar",
    createdAt: iso(-hours(3)),
    expiresAt: iso(hours(21)),
  },
  {
    id: "s2",
    companyId: "c_microsoft",
    mediaUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    type: "trainee",
    title: "Programa Trainee 2026",
    subtitle: "Todas áreas",
    ctaLabel: "Candidatar",
    createdAt: iso(-hours(5)),
    expiresAt: iso(hours(19)),
  },
  {
    id: "s3",
    companyId: "c_sap",
    mediaUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    type: "internship",
    title: "Estágio em Cloud",
    subtitle: "SP • Híbrido",
    ctaLabel: "Ver Vaga",
    createdAt: iso(-hours(1)),
    expiresAt: iso(hours(23)),
  },
  {
    id: "s4",
    companyId: "c_deloitte",
    mediaUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800",
    type: "event",
    title: "Deloitte Talks: IA & Finanças",
    subtitle: "Amanhã 19h",
    ctaLabel: "RSVP",
    createdAt: iso(-hours(8)),
    expiresAt: iso(hours(16)),
  },
  {
    id: "s5",
    companyId: "c_nubank",
    mediaUrl:
      "https://images.unsplash.com/photo-1611095973763-414019e72400?w=800",
    type: "challenge",
    title: "Nu Data Challenge",
    subtitle: "R$ 30k em prêmios",
    ctaLabel: "Entrar",
    createdAt: iso(-hours(2)),
    expiresAt: iso(hours(22)),
  },
  {
    id: "s6",
    companyId: "c_google",
    mediaUrl:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=800",
    type: "job",
    title: "APM Program 2026",
    subtitle: "Associate PM",
    ctaLabel: "Candidatar",
    createdAt: iso(-hours(4)),
    expiresAt: iso(hours(20)),
  },
  {
    id: "s7",
    companyId: "c_itau",
    mediaUrl:
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800",
    type: "trainee",
    title: "Trainee Itaú 2026",
    subtitle: "R$ 8.5k + benefícios",
    ctaLabel: "Ver mais",
    createdAt: iso(-hours(6)),
    expiresAt: iso(hours(18)),
  },
  {
    id: "s8",
    companyId: "c_ambev",
    mediaUrl:
      "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800",
    type: "trainee",
    title: "Ambev Global Trainee",
    subtitle: "Inscrições abertas",
    ctaLabel: "Aplicar",
    createdAt: iso(-hours(9)),
    expiresAt: iso(hours(15)),
  },
  {
    id: "s9",
    companyId: "c_xp",
    mediaUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    type: "hackathon",
    title: "XP Tech Hackathon",
    subtitle: "48h • Prêmios",
    ctaLabel: "Entrar",
    createdAt: iso(-hours(7)),
    expiresAt: iso(hours(17)),
  },
  {
    id: "s10",
    companyId: "c_btg",
    mediaUrl:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800",
    type: "internship",
    title: "Estágio em Banking",
    subtitle: "SP • Presencial",
    ctaLabel: "Ver Vaga",
    createdAt: iso(-hours(10)),
    expiresAt: iso(hours(14)),
  },
];

// ============ FEED ============

export const FEED: FeedPost[] = [
  {
    id: "f2",
    companyId: "c_microsoft",
    kind: "challenge",
    title: "Microsoft lançou desafio de Azure AI",
    body:
      "Construa uma solução usando Azure OpenAI e concorra a US$ 10k + entrevistas priorizadas.",
    imageUrl:
      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1000",
    createdAt: iso(-hours(4)),
    reactions: 342,
    comments: 56,
  },
  {
    id: "f3",
    companyId: "c_sap",
    kind: "job_opened",
    title:
      "SAP abriu inscrições para estágio em Cloud",
    body:
      "Programa de 2 anos com rotação por diferentes squads. Salário R$ 3.5k.",
    imageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000",
    createdAt: iso(-hours(6)),
    reactions: 89,
    comments: 12,
  },
  {
    id: "f4",
    companyId: "c_ibm",
    kind: "hackathon",
    title:
      "IBM Call for Code — Inscrições até 25/03",
    body:
      "Times de 2 a 5 pessoas. Tema: sustentabilidade + IA. Premiação US$ 200k.",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000",
    createdAt: iso(-hours(1)),
    reactions: 512,
    comments: 87,
  },
  {
    id: "f5",
    companyId: "c_nubank",
    kind: "job_opened",
    title:
      "Nubank contrata 30 engenheiros de software",
    body:
      "Vagas jr, pl e sr. Stack: Clojure, Kotlin, React. 100% remoto.",
    imageUrl:
      "https://images.unsplash.com/photo-1611095973763-414019e72400?w=1000",
    createdAt: iso(-hours(9)),
    reactions: 421,
    comments: 92,
  },
  {
    id: "f6",
    companyId: "c_google",
    kind: "event",
    title: "Google Dev Fest São Paulo — 15/04",
    body:
      "Conferência oficial do Google Developer Groups. Inscrições gratuitas.",
    imageUrl:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1000",
    createdAt: iso(-hours(12)),
    reactions: 267,
    comments: 38,
  },
  {
    id: "f7",
    companyId: "c_xp",
    kind: "job_opened",
    title:
      "XP contrata trainees para todas as áreas",
    body:
      "Programa 24 meses. Salário R$ 8k + benefícios. Prazo 30/03.",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1000",
    createdAt: iso(-hours(14)),
    reactions: 189,
    comments: 31,
  },
  {
    id: "f8",
    companyId: "c_itau",
    kind: "article",
    title:
      "Como o Itaú está usando LLMs em produção",
    body:
      "Artigo técnico do time de IA do Cubo Itaú sobre embeddings e RAG em escala.",
    imageUrl:
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1000",
    createdAt: iso(-hours(18)),
    reactions: 156,
    comments: 22,
  },
];

// ============ JOBS ============

export const JOBS: JobOpportunity[] = [
  {
    id: "j1",
    companyId: "c_deloitte",
    title: "Data Analyst Jr",
    seniority: "junior",
    salary: "R$ 5.500 - R$ 7.000",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: ["SQL", "Python", "Power BI", "Excel"],
    description:
      "Análise de dados para clientes de diversos setores. Você terá contato com desafios reais e trabalhará com times multidisciplinares.",
    benefits: [
      "VR/VA R$ 40/dia",
      "Plano de saúde",
      "Gympass",
      "Bônus anual",
    ],
    matchScore: 92,
    postedAt: iso(-days(1)),
  },
  {
    id: "j2",
    companyId: "c_nubank",
    title: "Software Engineer",
    seniority: "pleno",
    salary: "R$ 12.000 - R$ 18.000",
    workModel: "remoto",
    location: "100% Remoto",
    skills: [
      "Clojure",
      "Kotlin",
      "AWS",
      "PostgreSQL",
    ],
    description:
      "Desenvolva features do coração do Nubank. Squads autônomas, sem microgerência, foco em impacto real para milhões de clientes.",
    benefits: [
      "Stock options",
      "Plano de saúde top",
      "R$ 500/mês educação",
      "Home office setup",
    ],
    matchScore: 87,
    postedAt: iso(-days(2)),
  },
  {
    id: "j3",
    companyId: "c_google",
    title: "Associate Product Manager",
    seniority: "junior",
    salary: "R$ 15.000 - R$ 22.000",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: [
      "Product Management",
      "SQL",
      "Analytics",
      "Inglês",
    ],
    description:
      "Programa APM do Google. 2 anos rotacionando em 2 produtos diferentes. Preparação para PM sênior.",
    benefits: [
      "Refeição no escritório",
      "Massagem",
      "Academia",
      "Plano de saúde",
    ],
    matchScore: 78,
    postedAt: iso(-days(1)),
  },
  {
    id: "j4",
    companyId: "c_microsoft",
    title: "Cloud Solutions Architect",
    seniority: "senior",
    salary: "R$ 20.000 - R$ 30.000",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: [
      "Azure",
      "Kubernetes",
      "Terraform",
      "C#",
    ],
    description:
      "Desenhe arquiteturas cloud para grandes clientes enterprise. Certificações Azure serão financiadas.",
    benefits: [
      "ESPP",
      "Plano de saúde global",
      "40h/semana",
      "Sabbatical",
    ],
    matchScore: 71,
    postedAt: iso(-days(3)),
  },
  {
    id: "j5",
    companyId: "c_sap",
    title: "Estágio em Cloud",
    seniority: "estagio",
    salary: "R$ 3.500",
    workModel: "hibrido",
    location: "São Leopoldo, RS",
    skills: ["Java", "Cloud", "SQL", "Inglês"],
    description:
      "Programa de 2 anos com rotação. Foco em SAP BTP.",
    benefits: [
      "Bolsa auxílio",
      "Refeição",
      "Plano de saúde",
      "Transporte",
    ],
    matchScore: 84,
    postedAt: iso(-hours(20)),
  },
  {
    id: "j6",
    companyId: "c_itau",
    title: "Trainee Itaú 2026",
    seniority: "trainee",
    salary: "R$ 8.500",
    workModel: "presencial",
    location: "São Paulo, SP",
    skills: [
      "Análise",
      "Comunicação",
      "Inglês",
      "Excel",
    ],
    description:
      "Programa 18 meses com rotação por 3 áreas. Um dos maiores do Brasil.",
    benefits: [
      "VR/VA",
      "Plano top",
      "Bônus",
      "Educação",
    ],
    matchScore: 82,
    postedAt: iso(-days(1)),
  },
  {
    id: "j7",
    companyId: "c_ambev",
    title: "Global Management Trainee",
    seniority: "trainee",
    salary: "R$ 9.000",
    workModel: "presencial",
    location: "São Paulo, SP",
    skills: [
      "Liderança",
      "Inglês",
      "Negócios",
      "Excel",
    ],
    description:
      "Programa global com rotação internacional após 12 meses.",
    benefits: [
      "Carro",
      "Notebook",
      "Plano de saúde",
      "Educação exec",
    ],
    matchScore: 68,
    postedAt: iso(-days(2)),
  },
  {
    id: "j8",
    companyId: "c_xp",
    title: "Analista de Renda Variável",
    seniority: "junior",
    salary: "R$ 7.000 - R$ 10.000",
    workModel: "presencial",
    location: "São Paulo, SP",
    skills: ["CFA", "Excel", "SQL", "Python"],
    description:
      "Analise ações e monte teses de investimento para milhões de clientes.",
    benefits: [
      "PLR",
      "VR premium",
      "Plano de saúde",
      "Cursos",
    ],
    matchScore: 74,
    postedAt: iso(-hours(30)),
  },
  {
    id: "j9",
    companyId: "c_btg",
    title: "Trader Jr",
    seniority: "junior",
    salary: "R$ 12.000+",
    workModel: "presencial",
    location: "São Paulo, SP",
    skills: [
      "Python",
      "Estatística",
      "Derivativos",
      "Inglês",
    ],
    description:
      "Trading desk de derivativos. Ambiente competitivo e de alta performance.",
    benefits: [
      "PLR agressivo",
      "Plano top",
      "Refeição",
      "Academia",
    ],
    matchScore: 65,
    postedAt: iso(-days(2)),
  },
  {
    id: "j10",
    companyId: "c_ibm",
    title: "Consultor SAP Jr",
    seniority: "junior",
    salary: "R$ 6.500",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: ["SAP", "ABAP", "SQL", "Inglês"],
    description:
      "Implante SAP em grandes clientes com apoio do time global da IBM.",
    benefits: [
      "Certificações",
      "Plano de saúde",
      "Home office parcial",
      "Bônus",
    ],
    matchScore: 79,
    postedAt: iso(-days(3)),
  },
  {
    id: "j11",
    companyId: "c_nubank",
    title: "Data Scientist",
    seniority: "pleno",
    salary: "R$ 14.000 - R$ 20.000",
    workModel: "remoto",
    location: "100% Remoto",
    skills: ["Python", "SQL", "ML", "AWS"],
    description:
      "Modelos de crédito, fraude e engajamento em escala.",
    benefits: [
      "Stock options",
      "Plano top",
      "Educação",
      "Setup",
    ],
    matchScore: 89,
    postedAt: iso(-hours(15)),
  },
  {
    id: "j12",
    companyId: "c_google",
    title: "Software Engineer New Grad",
    seniority: "junior",
    salary: "R$ 16.000+",
    workModel: "hibrido",
    location: "Belo Horizonte, MG",
    skills: [
      "Java",
      "Go",
      "System Design",
      "Inglês",
    ],
    description:
      "Programa para recém-formados. Onboarding intensivo de 3 meses.",
    benefits: [
      "Refeição no escritório",
      "Todos benefícios Google",
      "RSU",
    ],
    matchScore: 83,
    postedAt: iso(-days(1)),
  },
  {
    id: "j13",
    companyId: "c_microsoft",
    title: "Program Manager Intern",
    seniority: "estagio",
    salary: "R$ 5.000",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: [
      "PM",
      "SQL",
      "Comunicação",
      "Inglês",
    ],
    description:
      "Estágio de PM na equipe de Copilot. Programa de 12 meses.",
    benefits: [
      "Bolsa alta",
      "Plano de saúde",
      "Transporte",
      "Mentoria sênior",
    ],
    matchScore: 76,
    postedAt: iso(-hours(40)),
  },
  {
    id: "j14",
    companyId: "c_deloitte",
    title: "Consultor Estratégia",
    seniority: "junior",
    salary: "R$ 8.500",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: [
      "Estratégia",
      "Excel",
      "PowerPoint",
      "Inglês",
    ],
    description:
      "Consultoria em estratégia para C-level de grandes empresas.",
    benefits: [
      "PLR",
      "Plano top",
      "Cursos MBA",
      "Viagens",
    ],
    matchScore: 77,
    postedAt: iso(-days(4)),
  },
  {
    id: "j15",
    companyId: "c_sap",
    title: "SAP Basis Analyst",
    seniority: "pleno",
    salary: "R$ 10.000 - R$ 14.000",
    workModel: "hibrido",
    location: "São Paulo, SP",
    skills: [
      "SAP Basis",
      "Linux",
      "HANA",
      "Cloud",
    ],
    description:
      "Administre ambientes SAP para grandes clientes.",
    benefits: [
      "Certificações pagas",
      "Plano top",
      "Home office",
      "Bônus",
    ],
    matchScore: 70,
    postedAt: iso(-days(2)),
  },
];

// ============ USERS ============

export const USERS: UserProfile[] = [
  {
    id: "u_me",
    name: "Você",
    handle: "@voce",
    avatarUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400",
    course: "Ciência da Computação",
    semester: 6,
    bio:
      "Estudante FECAP apaixonado por dados e produto.",
    github: "voce",
    linkedin: "voce",
    portfolio: "voce.dev",
    skills: [
      "Python",
      "SQL",
      "React",
      "TypeScript",
    ],
    languages: ["Português", "Inglês"],
    companyDesired: "c_nubank",
    role: "student",
    xp: 1240,
    level: 5,
    badges: [],
    isMe: true,
  },
  {
    id: "u_bruno",
    name: "Bruno Silva",
    handle: "@brunosilva",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    course: "Ciência da Computação",
    semester: 8,
    bio: "Full-stack, ex-hackathon champion.",
    skills: ["React", "Node", "Kotlin"],
    languages: ["Português", "Inglês"],
    companyCurrent: "c_deloitte",
    role: "student",
    xp: 3400,
    level: 9,
    badges: [],
  },
  {
    id: "u_mauricio",
    name: "Maurício Costa",
    handle: "@maucosta",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    course: "Sistemas de Informação",
    semester: 10,
    bio:
      "Alumni FECAP, hoje eng na Nubank.",
    skills: ["Clojure", "Kotlin", "AWS"],
    languages: [
      "Português",
      "Inglês",
      "Espanhol",
    ],
    companyCurrent: "c_nubank",
    role: "alumni",
    xp: 8700,
    level: 15,
    badges: [],
  },
  {
    id: "u_ana",
    name: "Ana Ferreira",
    handle: "@anaferreira",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    course: "ADM",
    semester: 9,
    bio: "Trainee Ambev 2025.",
    skills: ["Excel", "SQL", "Estratégia"],
    languages: ["Português", "Inglês"],
    companyCurrent: "c_ambev",
    role: "alumni",
    xp: 5200,
    level: 11,
    badges: [],
  },
  {
    id: "u_carlos",
    name: "Carlos Deloitte",
    handle: "@carlosdeloitte",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    course: "Engenharia",
    semester: 12,
    bio: "Sênior Manager na Deloitte.",
    skills: ["Estratégia", "M&A", "Advisory"],
    languages: [
      "Português",
      "Inglês",
      "Francês",
    ],
    companyCurrent: "c_deloitte",
    role: "alumni",
    xp: 12300,
    level: 20,
    badges: [],
  },
  {
    id: "u_beatriz",
    name: "Beatriz Lima",
    handle: "@blima",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
    course: "Ciência de Dados",
    semester: 5,
    bio: "Data science, ML, kaggler.",
    skills: ["Python", "PyTorch", "SQL"],
    languages: ["Português", "Inglês"],
    role: "student",
    xp: 2800,
    level: 7,
    badges: [],
  },
  {
    id: "u_luana",
    name: "Luana Rocha",
    handle: "@drocha",
    avatarUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400",
    course: "Ciência da Computação",
    semester: 7,
    bio: "iOS dev, indie maker.",
    skills: [
      "Swift",
      "React Native",
      "TypeScript",
    ],
    languages: ["Português", "Inglês"],
    role: "student",
    xp: 4100,
    level: 10,
    badges: [],
  },
  {
    id: "u_prof_marcos",
    name: "Prof. Marcos",
    handle: "@profmarcos",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    course: "Engenharia de Software (FECAP)",
    semester: 0,
    bio:
      "Professor de ES na FECAP. PhD em Grafos.",
    skills: ["Algoritmos", "Grafos", "IA"],
    languages: ["Português", "Inglês"],
    role: "professor",
    xp: 9800,
    level: 17,
    badges: [],
  },
  {
    id: "u_juliana",
    name: "Juliana IBM",
    handle: "@juibm",
    avatarUrl:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400",
    course: "Ciência da Computação",
    semester: 12,
    bio: "Engenheira senior IBM Watson.",
    skills: ["AI", "Java", "Kubernetes"],
    languages: ["Português", "Inglês"],
    companyCurrent: "c_ibm",
    role: "alumni",
    xp: 14500,
    level: 22,
    badges: [],
  },
  {
    id: "u_pedro",
    name: "Pedro Santos",
    handle: "@pesantos",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    course: "ADM",
    semester: 6,
    bio: "Aspirante a PM.",
    skills: ["PM", "Analytics", "SQL"],
    languages: ["Português", "Inglês"],
    companyDesired: "c_google",
    role: "student",
    xp: 1900,
    level: 6,
    badges: [],
  },
  {
    id: "u_gabriela",
    name: "Gabriela Nu",
    handle: "@gabnu",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    course: "Ciência da Computação",
    semester: 12,
    bio: "Staff eng Nubank.",
    skills: ["Clojure", "Datomic", "AWS"],
    languages: ["Português", "Inglês"],
    companyCurrent: "c_nubank",
    role: "alumni",
    xp: 15200,
    level: 23,
    badges: [],
  },
];

// Add badges to user

USERS[0].badges = [
  {
    id: "b1",
    label: "Primeiro Match",
    icon: "flame",
    earnedAt: iso(-days(15)),
  },
  {
    id: "b2",
    label: "Networking Master",
    icon: "people",
    earnedAt: iso(-days(7)),
  },
  {
    id: "b3",
    label: "Explorador",
    icon: "compass",
    earnedAt: iso(-days(3)),
  },
];

// ============ CONNECTIONS (Graph edges) ============
//
// Structure:
//
// Você (u_me) -> Bruno (u_bruno)
// Bruno -> Maurício (Nubank)
//
// Você -> Beatriz -> Diego -> Juliana IBM
//
// Você -> Pedro -> Prof Marcos -> Carlos Deloitte
//
// Você -> Ana Ambev
//
// Maurício -> Gabriela Nu
//

export const CONNECTIONS: Connection[] = [
  {
    fromId: "u_me",
    toId: "u_bruno",
    strength: 3,
    since: iso(-days(120)),
  },
  {
    fromId: "u_me",
    toId: "u_beatriz",
    strength: 3,
    since: iso(-days(90)),
  },
  {
    fromId: "u_me",
    toId: "u_pedro",
    strength: 2,
    since: iso(-days(60)),
  },
  {
    fromId: "u_me",
    toId: "u_ana",
    strength: 2,
    since: iso(-days(30)),
  },
  {
    fromId: "u_me",
    toId: "u_luana",
    strength: 2,
    since: iso(-days(45)),
  },
  {
    fromId: "u_bruno",
    toId: "u_mauricio",
    strength: 3,
    since: iso(-days(200)),
  },
  {
    fromId: "u_mauricio",
    toId: "u_gabriela",
    strength: 3,
    since: iso(-days(150)),
  },
  {
    fromId: "u_beatriz",
    toId: "u_diego",
    strength: 2,
    since: iso(-days(70)),
  },
  {
    fromId: "u_diego",
    toId: "u_juliana",
    strength: 2,
    since: iso(-days(180)),
  },
  {
    fromId: "u_pedro",
    toId: "u_prof_marcos",
    strength: 3,
    since: iso(-days(300)),
  },
  {
    fromId: "u_prof_marcos",
    toId: "u_carlos",
    strength: 3,
    since: iso(-days(500)),
  },
  {
    fromId: "u_prof_marcos",
    toId: "u_juliana",
    strength: 2,
    since: iso(-days(250)),
  },
  {
    fromId: "u_carlos",
    toId: "u_juliana",
    strength: 1,
    since: iso(-days(400)),
  },
  {
    fromId: "u_bruno",
    toId: "u_beatriz",
    strength: 2,
    since: iso(-days(100)),
  },
];

// ============ EVENTS ============

export const EVENTS: Event[] = [
  {
    id: "e1",
    companyId: "c_ibm",
    title: "IBM Call for Code — Kickoff SP",
    kind: "hackathon",
    date: iso(days(3)),
    location: "IBM Tower, São Paulo",
    coverUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000",
    description:
      "Hackathon global de sustentabilidade + IA. Times FECAP têm entrada prioritária.",
    attendees: 342,
  },
  {
    id: "e2",
    companyId: "c_google",
    title: "Google DevFest São Paulo 2026",
    kind: "meetup",
    date: iso(days(21)),
    location: "WTC Convention",
    coverUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000",
    description:
      "Maior evento GDG do Brasil.",
    attendees: 1200,
  },
  {
    id: "e3",
    companyId: "c_nubank",
    title: "Nu Data Challenge Finale",
    kind: "workshop",
    date: iso(days(10)),
    location: "Nu HQ, SP",
    coverUrl:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1000",
    description:
      "Final do desafio de dados do Nubank com R$ 30k em prêmios.",
    attendees: 88,
  },
  {
    id: "e4",
    companyId: "c_deloitte",
    title: "Deloitte Talks: IA & Finanças",
    kind: "talk",
    date: iso(days(1)),
    location: "Online",
    coverUrl:
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1000",
    description:
      "Painel com C-levels da Deloitte discutindo o futuro da IA no setor financeiro.",
    attendees: 512,
  },
];

// ============ NOTIFICATIONS ============

export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Novo match!",
    body:
      "A vaga de Data Analyst Jr da Deloitte deu match com você.",
    icon: "flame",
    createdAt: iso(-hours(1)),
    read: false,
  },
  {
    id: "n2",
    title: "Nova conexão",
    body: "Bruno Silva aceitou seu convite.",
    icon: "person-add",
    createdAt: iso(-hours(4)),
    read: false,
  },
  {
    id: "n3",
    title: "Story publicado",
    body:
      "Nubank publicou um novo story: Nu Data Challenge.",
    icon: "camera",
    createdAt: iso(-hours(2)),
    read: true,
  },
  {
    id: "n4",
    title: "Hackathon amanhã",
    body:
      "IBM Call for Code começa em 24h. Pronto?",
    icon: "trophy",
    createdAt: iso(-hours(6)),
    read: true,
  },
  {
    id: "n5",
    title: "Mentoria confirmada",
    body:
      "Maurício Costa aceitou seu pedido de mentoria.",
    icon: "cafe",
    createdAt: iso(-hours(12)),
    read: true,
  },
];

// ============ LOOKUP HELPERS ============

export const companyById = (
  id: string,
): Company | undefined =>
  COMPANIES.find((company) => company.id === id);

export const userById = (
  id: string,
): UserProfile | undefined =>
  USERS.find((user) => user.id === id);

export const jobById = (
  id: string,
): JobOpportunity | undefined =>
  JOBS.find((job) => job.id === id);