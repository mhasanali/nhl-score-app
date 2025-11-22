import { NhlApiService } from './nhl-api.service';

async function test() {
  const service = new NhlApiService();

  console.log('Testing NHL API Service...\n');

  try {
    const data = await service.fetchRecentGames();
    console.log('Success!');
    console.log(`Games fetched: ${data.length || 0}`);
    console.log(`First game teams: data[0]?.awayTeam.name & Home Team: ${data[0]?.homeTeam.name}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();