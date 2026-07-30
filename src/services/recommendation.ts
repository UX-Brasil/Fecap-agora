import type { Company, JobOpportunity, UserProfile } from "../types";

const PARTNER_BOOST = 20;

interface MatchScoreParams {
  job: JobOpportunity;
  company?: Company;
  user: UserProfile;
  skillCompatibility: number;
  areaCompatibility: number;
  locationCompatibility: number;
}

export function calculateJobMatchScore({
  company,
  skillCompatibility,
  areaCompatibility,
  locationCompatibility,
}: MatchScoreParams): number {
  const skillsScore = skillCompatibility * 0.5;
  const areaScore = areaCompatibility * 0.3;
  const locationScore = locationCompatibility * 0.2;

  const compatibilityScore = skillsScore + areaScore + locationScore;
  const fecapPartnerBoost =
    company?.isFecapPartner === true
      ? company.recommendationBoost ?? PARTNER_BOOST
      : 0;

  return Math.min(100, Math.round(compatibilityScore + fecapPartnerBoost));
}

export function sortCompaniesForFecap(companies: Company[]): Company[] {
  return [...companies].sort((companyA, companyB) => {
    const partnerDifference =
      Number(companyB.isFecapPartner) - Number(companyA.isFecapPartner);

    if (partnerDifference !== 0) {
      return partnerDifference;
    }

    const boostDifference =
      (companyB.recommendationBoost ?? 0) - (companyA.recommendationBoost ?? 0);

    if (boostDifference !== 0) {
      return boostDifference;
    }

    return companyA.name.localeCompare(companyB.name, "pt-BR");
  });
}

export function getCompanyLogo(company: Company): string {
  return company.logo ?? company.logoUrl ?? "";
}
