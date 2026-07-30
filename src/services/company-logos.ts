import { fecapPartnerCompanies } from "./fecap-partners";

const partnerMap = new Map(
  fecapPartnerCompanies.map((c) => [
    c.name.toLowerCase().trim(),
    c.logo,
  ])
);

const aliasMap = new Map<string, string>([
  ["itaú", "Itaú Unibanco"],
  ["itau", "Itaú Unibanco"],
  ["google llc", "Google"],
  ["google brasil", "Google"],
  ["pwc brasil", "PwC"],
  ["pricewaterhousecoopers", "PwC"],
  ["young & rubicam", "Y&R"],
  ["young and rubicam", "Y&R"],
  ["jr", "JWT"],
]);

export function getCompanyLogo(companyName: string) {
  const normalized = companyName.toLowerCase().trim();

  const alias = aliasMap.get(normalized);

  if (alias) {
    const logo = partnerMap.get(alias.toLowerCase());

    if (logo) return logo;
  }

  return partnerMap.get(normalized);
}