// Graph service: BFS shortest path between two users in the network.
// Used to answer "You are N connections away from X".

import { CONNECTIONS, USERS, companyById, userById } from "./mock-data";
import { Connection, UserProfile } from "@/src/types";

type Adjacency = Map<string, string[]>;

let cachedAdjacency: Adjacency | null = null;

function buildAdjacency(): Adjacency {
  if (cachedAdjacency) return cachedAdjacency;
  const adj: Adjacency = new Map();
  for (const c of CONNECTIONS) {
    if (!adj.has(c.fromId)) adj.set(c.fromId, []);
    if (!adj.has(c.toId)) adj.set(c.toId, []);
    adj.get(c.fromId)!.push(c.toId);
    adj.get(c.toId)!.push(c.fromId);
  }
  cachedAdjacency = adj;
  return adj;
}

export function shortestPath(fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = buildAdjacency();
  const visited = new Set<string>([fromId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const neighbors = adj.get(id) ?? [];
    for (const n of neighbors) {
      if (visited.has(n)) continue;
      const newPath = [...path, n];
      if (n === toId) return newPath;
      visited.add(n);
      queue.push({ id: n, path: newPath });
    }
  }
  return null;
}

export function degreesBetween(fromId: string, toId: string): number | null {
  const p = shortestPath(fromId, toId);
  if (!p) return null;
  return p.length - 1;
}

// Find shortest path to any employee of a given company.
export function pathToCompany(fromId: string, companyId: string): { targetUser: UserProfile; path: string[] } | null {
  const candidates = USERS.filter((u) => u.companyCurrent === companyId);
  let best: { targetUser: UserProfile; path: string[] } | null = null;
  for (const c of candidates) {
    const p = shortestPath(fromId, c.id);
    if (!p) continue;
    if (!best || p.length < best.path.length) best = { targetUser: c, path: p };
  }
  return best;
}

// Get direct connections of a user
export function directConnections(userId: string): UserProfile[] {
  const adj = buildAdjacency();
  const ids = adj.get(userId) ?? [];
  return ids.map(userById).filter((u): u is UserProfile => Boolean(u));
}

// Get 2nd-degree connections (friends of friends, excluding direct + self)
export function secondDegreeConnections(userId: string): UserProfile[] {
  const adj = buildAdjacency();
  const first = new Set(adj.get(userId) ?? []);
  first.add(userId);
  const second = new Set<string>();
  for (const f of adj.get(userId) ?? []) {
    for (const ff of adj.get(f) ?? []) {
      if (!first.has(ff)) second.add(ff);
    }
  }
  return Array.from(second).map(userById).filter((u): u is UserProfile => Boolean(u));
}

// Compute node positions for a small radial layout, centered on the current user.
// Deterministic based on id order.
export function computeGraphLayout(userId: string, radius: number = 130) {
  const adj = buildAdjacency();
  const first = adj.get(userId) ?? [];
  const nodes: { id: string; x: number; y: number; ring: number }[] = [
    { id: userId, x: 0, y: 0, ring: 0 },
  ];
  first.forEach((id, i) => {
    const a = (i / first.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ id, x: Math.cos(a) * radius, y: Math.sin(a) * radius, ring: 1 });
  });

  // Add up to 8 second-degree nodes on outer ring
  const secondSet = new Set<string>();
  for (const f of first) {
    for (const ff of adj.get(f) ?? []) {
      if (ff !== userId && !first.includes(ff)) secondSet.add(ff);
    }
  }
  const secondArr = Array.from(secondSet).slice(0, 8);
  secondArr.forEach((id, i) => {
    const a = (i / secondArr.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ id, x: Math.cos(a) * radius * 2, y: Math.sin(a) * radius * 2, ring: 2 });
  });

  const edges: { from: string; to: string }[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const c of CONNECTIONS) {
    if (nodeIds.has(c.fromId) && nodeIds.has(c.toId)) {
      edges.push({ from: c.fromId, to: c.toId });
    }
  }
  return { nodes, edges };
}

// Format path for UI display: "Você → Bruno → Maurício"
export function formatPathNames(path: string[]): string {
  return path.map((id) => userById(id)?.name.split(" ")[0] ?? "?").join(" → ");
}

export function companyPathSummary(fromId: string, companyId: string): string {
  const result = pathToCompany(fromId, companyId);
  if (!result) return "Nenhuma conexão encontrada ainda.";
  const degrees = result.path.length - 1;
  const company = companyById(companyId);
  return `Você está a ${degrees} conexõe${degrees === 1 ? "" : "s"} de ${result.targetUser.name.split(" ")[0]} (${company?.name}).`;
}
