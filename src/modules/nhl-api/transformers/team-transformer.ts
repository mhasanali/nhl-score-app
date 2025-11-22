import { NhlTeamDto } from '../dto/nhl-team.dto';
import { Team } from '../../../common/interfaces/game.interface';

/**
 * Team Transformer
 * 
 * Transforms NHL API team data to our domain model
 */
export class TeamTransformer {
  static toDomain(dto: NhlTeamDto, score: number): Team {
    return {
      id: dto.id,
      name: `${dto.locationName} ${dto.teamName}`,  // Location and team name merged makes sense
      abbreviation: dto.abbreviation,
      score: score,
      logo: null, // Can't yet see the team logo
    };
  }


  // DTO list to Team List
  static toDomainBatch(dtos: NhlTeamDto[], scores: { [abbr: string]: number }): Team[] {
    return dtos.map(dto => this.toDomain(dto, scores[dto.abbreviation] || 0));
  }
}