import { Test, TestingModule } from '@nestjs/testing';
import { NhlApiService } from '.././nhl-api/nhl-api.service';
import axios from 'axios';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NhlApiService', () => {
  let service: NhlApiService;
  let mockGet: jest.Mock;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock get function
    mockGet = jest.fn();

    // Mock axios.create() to return an object with our mock get function
    mockedAxios.create = jest.fn().mockReturnValue({
      get: mockGet,
    } as any);

    // Create the testing module AFTER setting up mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [NhlApiService],
    }).compile();

    service = module.get<NhlApiService>(NhlApiService);
  });

  describe('fetchRecentGames', () => {
    it('should fetch and transform games successfully', async () => {
      // Arrange: Mock successful API response
      const mockApiResponse = {
        data: [
          {
            date: { raw: '2025-11-21', pretty: 'Thu Nov 21' },
            games: [
              {
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
                scores: { TOR: 3, MTL: 2 },
              },
            ],
          },
        ],
      };

      mockGet.mockResolvedValue(mockApiResponse);

      // Act
      const result = await service.fetchRecentGames(7);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].homeTeam.name).toBe('Toronto Maple Leafs');
      expect(result[0].awayTeam.name).toBe('Montreal Canadiens');
      expect(result[0].homeTeam.score).toBe(3);
      expect(result[0].awayTeam.score).toBe(2);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      // Arrange: First call fails, second succeeds
      const successResponse = {
        data: [
          {
            date: { raw: '2025-11-21', pretty: 'Thu Nov 21' },
            games: [],
          },
        ],
      };

      mockGet
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(successResponse);

      // Act
      const result = await service.fetchRecentGames(7);

      // Assert
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });

    it('should throw after max retries', async () => {
      // Arrange: All calls fail
      mockGet.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.fetchRecentGames(7)).rejects.toThrow(
        'Failed to fetch NHL data',
      );
      expect(mockGet).toHaveBeenCalledTimes(3); // MAX_RETRIES from Constants
    });

    it('should handle empty game list', async () => {
      // Arrange
      const emptyResponse = {
        data: [
          {
            date: { raw: '2025-11-21', pretty: 'Thu Nov 21' },
            games: [],
          },
        ],
      };

      mockGet.mockResolvedValue(emptyResponse);

      // Act
      const result = await service.fetchRecentGames(7);

      // Assert
      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchLast30Days', () => {
    it('should fetch in 7-day chunks', async () => {
      // Arrange: Mock successful responses for all chunks
      const mockResponse = {
        data: [
          {
            date: { raw: '2025-11-21', pretty: 'Thu Nov 21' },
            games: [
              {
                startTime: '2025-11-21T00:00:00Z',
                status: { state: 'FINAL' },
                teams: {
                  home: {
                    id: 1,
                    abbreviation: 'A',
                    locationName: 'A',
                    shortName: 'A',
                    teamName: 'A',
                  },
                  away: {
                    id: 2,
                    abbreviation: 'B',
                    locationName: 'B',
                    shortName: 'B',
                    teamName: 'B',
                  },
                },
                scores: { A: 1, B: 2 },
              },
            ],
          },
        ],
      };

      mockGet.mockResolvedValue(mockResponse);

      // Act
      const result = await service.fetchLast30Days();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // Should make multiple calls (30 days / 7 days per chunk = ~5 calls)
      expect(mockGet.mock.calls.length).toBeGreaterThanOrEqual(4);
    }, 10000); // Increase timeout for this test
  });
});