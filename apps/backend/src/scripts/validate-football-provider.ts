import '../config/bootstrap';
import { FootballDataOrgAdapter } from '../infrastructure/sports/providers/FootballDataOrgAdapter';

async function validate(): Promise<void> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured in the server environment');
  }

  const provider = new FootballDataOrgAdapter(apiKey);
  const [competitions, matches] = await Promise.all([
    provider.getCompetitions(),
    provider.getMatches({ date: 'today', limit: 3 }),
  ]);

  console.log(JSON.stringify({
    ok: true,
    provider: provider.key,
    competitions: competitions.length,
    sampleMatches: matches.length,
  }));
}

validate().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Football provider validation failed');
  process.exitCode = 1;
});
