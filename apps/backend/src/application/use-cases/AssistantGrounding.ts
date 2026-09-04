/**
 * Resolves every model-proposed item against an authoritative application source.
 * Candidates with no match are omitted rather than shown as plausible facts.
 */
export async function resolveGroundedRecommendations<Candidate, Match, Output>(
  candidates: Candidate[],
  resolve: (candidate: Candidate) => Promise<Match | null | undefined>,
  map: (candidate: Candidate, match: Match) => Output
): Promise<Output[]> {
  const resolved = await Promise.all(
    candidates.map(async (candidate) => {
      const match = await resolve(candidate);
      return { candidate, match };
    })
  );
  const output: Output[] = [];
  for (const entry of resolved) {
    if (entry.match !== null && typeof entry.match !== 'undefined') {
      output.push(map(entry.candidate, entry.match as Match));
    }
  }
  return output;
}
