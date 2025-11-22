import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Constants } from '../../common/constant';
import { NhlGameDto } from './dto/nhl-game.dto';
import { NhlResponseDto } from './dto/nhl-response.dto';
import { Game } from 'src/common/interfaces/game.interface';
import { GameTransformer } from './transformers/game-transformer';
/**
 * NHL API Service
 * 
 * Fetches game data from nhl-score-api.herokuapp.com
 * 
 * API ENDPOINTS:
 * - /api/scores/latest - Today's games
 * - /api/scores/YYYY-MM-DD - Specific date
 * - /api/scores/YYYY-MM-DD/YYYY-MM-DD - Date range
 */
@Injectable()
export class NhlApiService {
    private readonly logger = new Logger(NhlApiService.name);
    private readonly client: AxiosInstance;

    constructor(){
        this.client = axios.create({baseURL: Constants.BASE_URL, timeout: Constants.API_TIMEOUT, headers: Constants.HEADERS})
    }


    private async fetchGames(startDate: string, endDate: String): Promise<NhlResponseDto[]>{
    let lastError: any;
    let maxRetries = Constants.MAX_RETRIES;
    

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {

        this.logger.log(
          `Fetching games: ${startDate} to ${endDate} (attempt ${attempt}/${maxRetries})`,
        );

        
        const response = await this.client.get('', {
          params: {
            startDate,
            endDate,
          },
        });     
        
      // const allGames = response.flatMap(dateObj => dateObj.games);


        // First date's games - ASC order
        const gameCount = response.data[0].games?.length || 0;
        this.logger.log(`Fetched ${gameCount} games`);

        return response.data;
      } catch (error) {
        lastError = error;
        this.logger.error(`Attempt ${attempt} failed: ${error.message}`);
        console.log(error)

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          this.logger.log(`Retrying in ${delayMs}ms...`);
        }
      }
    }

    throw new Error(
      `Failed to fetch NHL data after ${maxRetries} attempts: ${lastError.message}`,
    );
    }

  async fetchRecentGames(): Promise<Game[]> {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const startDate = this.formatDate(sevenDaysAgo);
      const endDate = this.formatDate(today);

      const dtoResponse: NhlResponseDto[] = await this.fetchGames(startDate,endDate)
      
      const allGameDtos: NhlGameDto[] = dtoResponse.flatMap(
      (dateGroup) => dateGroup.games,
      );

      
      const domainGames: Game[] = GameTransformer.toDomainBatch(allGameDtos);

      this.logger.log(`Transformed ${domainGames.length} games to domain models`);

      return domainGames; 

}


    async fetchLast7Days(): Promise<NhlResponseDto[]> {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const startDate = this.formatDate(sevenDaysAgo);
    const endDate = this.formatDate(today);

    this.logger.log(`Fetching last 7 days: ${startDate} to ${endDate}`);
    return this.fetchGames(startDate, endDate);
  }

    private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  
}