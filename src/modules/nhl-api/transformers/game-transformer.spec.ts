import { GameTransformer } from './game-transformer';
import { NhlGameDto } from '../dto/nhl-game.dto';
import { GameStatus } from '../../../common/interfaces/game.interface';

describe('GameTransformer', () => {
  describe('toDomain', () => {
    it('should transform NHL API game to domain model', () => {
      // Arrange: Sample API response
      const apiGame: NhlGameDto = {
        startTime: '2025-11-21T00:00:00Z',
        status: { state: 'FINAL' },
        teams: {
          home: {
            id: 10,
            abbreviation: 'TOR',
            locationName: 'Toronto',
            shortName: 'Toronto',
            teamName: 'Maple Leafs',
          },
          away: {
            id: 8,
            abbreviation: 'MTL',
            locationName: 'Montreal',
            shortName: 'Montreal',
            teamName: 'Canadiens',
          },
        },
        scores: {
          TOR: 3,
          MTL: 2,
        },
      };

      // Act
      const result = GameTransformer.toDomain(apiGame);

      // Assert
      expect(result.gameId).toBe('2025-11-21T00:00:00Z_8_10');
      expect(result.startTime).toBe('2025-11-21T00:00:00Z');
      expect(result.status).toBe(GameStatus.FINAL);
      
      expect(result.homeTeam.id).toBe(10);
      expect(result.homeTeam.name).toBe('Toronto Maple Leafs');
      expect(result.homeTeam.score).toBe(3);
      
      expect(result.awayTeam.id).toBe(8);
      expect(result.awayTeam.name).toBe('Montreal Canadiens');
      expect(result.awayTeam.score).toBe(2);
      
      expect(result.participatingTeamIds).toEqual([8, 10]);
    });

    it('should handle missing scores', () => {
      // Arrange: Game without scores (scheduled)
      const apiGame: NhlGameDto = {
        startTime: '2025-11-25T00:00:00Z',
        status: { state: 'PREVIEW' },
        teams: {
          home: {
            id: 5,
            abbreviation: 'BOS',
            locationName: 'Boston',
            shortName: 'Boston',
            teamName: 'Bruins',
          },
          away: {
            id: 7,
            abbreviation: 'BUF',
            locationName: 'Buffalo',
            shortName: 'Buffalo',
            teamName: 'Sabres',
          },
        },
        scores: {},
      };

      // Act
      const result = GameTransformer.toDomain(apiGame);

      // Assert
      expect(result.homeTeam.score).toBe(0);
      expect(result.awayTeam.score).toBe(0);
      expect(result.status).toBe(GameStatus.PREVIEW);
    });

    it('should map all status types correctly', () => {
      const statuses = [
        { api: 'PREVIEW', expected: GameStatus.PREVIEW },
        { api: 'LIVE', expected: GameStatus.LIVE },
        { api: 'FINAL', expected: GameStatus.FINAL },
        { api: 'POSTPONED', expected: GameStatus.POSTPONED },
        { api: 'CANCELED', expected: GameStatus.CANCELED },
        { api: 'UNKNOWN', expected: GameStatus.OTHER },
      ];

      statuses.forEach(({ api, expected }) => {
        const apiGame: any = {
          startTime: '2025-11-21T00:00:00Z',
          status: { state: api },
          teams: {
            home: { id: 1, abbreviation: 'A', locationName: 'A', shortName: 'A', teamName: 'A' },
            away: { id: 2, abbreviation: 'B', locationName: 'B', shortName: 'B', teamName: 'B' },
          },
          scores: { A: 0, B: 0 },
        };

        const result = GameTransformer.toDomain(apiGame);
        expect(result.status).toBe(expected);
      });
    });
  });

  describe('toDomainBatch', () => {
    it('should transform multiple games', () => {
      // Arrange
      const apiGames: NhlGameDto[] = [
        {
          startTime: '2025-11-21T00:00:00Z',
          status: { state: 'FINAL' },
          teams: {
            home: { id: 1, abbreviation: 'A', locationName: 'A', shortName: 'A', teamName: 'A' },
            away: { id: 2, abbreviation: 'B', locationName: 'B', shortName: 'B', teamName: 'B' },
          },
          scores: { A: 3, B: 2 },
        },
        {
          startTime: '2025-11-21T01:00:00Z',
          status: { state: 'LIVE' },
          teams: {
            home: { id: 3, abbreviation: 'C', locationName: 'C', shortName: 'C', teamName: 'C' },
            away: { id: 4, abbreviation: 'D', locationName: 'D', shortName: 'D', teamName: 'D' },
          },
          scores: { C: 1, D: 1 },
        },
      ];

      // Act
      const result = GameTransformer.toDomainBatch(apiGames);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(GameStatus.FINAL);
      expect(result[1].status).toBe(GameStatus.LIVE);
    });
  });
});