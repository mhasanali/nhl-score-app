import { NhlGameDto } from '../dto/nhl-game.dto';
import { Game, GameStatus } from '../../../common/interfaces/game.interface';
import { TeamTransformer } from './team-transformer';
import { Logger } from '@nestjs/common';

/**
 * Game Transformer
 * 
 * Transforms NHL API game data to our domain model
 */
export class GameTransformer {
    private static readonly logger = new Logger(GameTransformer.name);

  static toDomain(dto: NhlGameDto): Game {
    
    // Implement the logic mentioned in the interface here
    const gameId = this.generateGameId(dto);

    // Creating team with the team transformer so it can be put in the game

    this.logger.log(`Transforming DTO to Interface for the game: ${dto}`);
    const homeTeam = TeamTransformer.toDomain(
      dto.teams.home,
      dto.scores[dto.teams.home.abbreviation] || 0,
    );

    const awayTeam = TeamTransformer.toDomain(
      dto.teams.away,
      dto.scores[dto.teams.away.abbreviation] || 0,
    );

    return {
      gameId,
      startTime: dto.startTime,
      status: this.mapStatus(dto.status.state),
      homeTeam,
      awayTeam,
      participatingTeamIds: [awayTeam.id, homeTeam.id],
      preGameStats: dto.preGameStats,
      _lastUpdated: new Date().toISOString(),
      _apiVersion: '1.0',
      _rawData: dto, // Store complete API response for deugging purposes.
    };
  }


  static toDomainBatch(dtos: NhlGameDto[]): Game[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  
  private static generateGameId(dto: NhlGameDto): string {
    return `${dto.startTime}_${dto.teams.away.id}_${dto.teams.home.id}`;
  }

private static mapStatus(apiStatus: string): GameStatus {
  if (!apiStatus) return GameStatus.OTHER;

  const normalized = apiStatus.trim().toUpperCase();

  const statusMap: Record<string, GameStatus> = {
    PREVIEW: GameStatus.PREVIEW,
    LIVE: GameStatus.LIVE,
    FINAL: GameStatus.FINAL,
    POSTPONED: GameStatus.POSTPONED,
    CANCELED: GameStatus.CANCELED,
  };

  return statusMap[normalized] ?? GameStatus.OTHER;
}
}