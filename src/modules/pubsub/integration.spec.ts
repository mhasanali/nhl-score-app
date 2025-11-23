import { Test, TestingModule } from '@nestjs/testing';
import { PubSubService } from './pubsub.service';
import { NhlApiService } from '../nhl-api/nhl-api.service';
import { FirestoreService } from '../firestore/firestore.service';
import { GameStatus } from '../../common/interfaces/game.interface';

describe('PubSub Integration', () => {
  let pubsubService: PubSubService;
  let nhlApiService: NhlApiService;
  let firestoreService: FirestoreService;

  const mockNhlApiService = {
    fetchRecentGames: jest.fn(),
  };

  const mockFirestoreService = {
    storeGames: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubSubService,
        { provide: NhlApiService, useValue: mockNhlApiService },
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    }).compile();

    pubsubService = module.get<PubSubService>(PubSubService);
    nhlApiService = module.get<NhlApiService>(NhlApiService);
    firestoreService = module.get<FirestoreService>(FirestoreService);

    jest.clearAllMocks();
  });

  it('should fetch and store games successfully', async () => {
    // Arrange
    const mockGames = [
      {
        gameId: 'test-1',
        startTime: '2025-11-21T00:00:00Z',
        status: GameStatus.FINAL,
        homeTeam: { id: 1, name: 'Toronto Maple Leafs', abbreviation: 'TOR', score: 3, logo: null },
        awayTeam: { id: 2, name: 'Montreal Canadiens', abbreviation: 'MTL', score: 2, logo: null },
        participatingTeamIds: [1, 2],
        _lastUpdated: '2025-11-21T00:00:00Z',
        _apiVersion: '1.0',
      },
    ];

    mockNhlApiService.fetchRecentGames.mockResolvedValue(mockGames);
    mockFirestoreService.storeGames.mockResolvedValue(undefined);

    // Act
    await pubsubService.fetchAndStoreNhlScores();

    // Assert
    expect(nhlApiService.fetchRecentGames).toHaveBeenCalledTimes(1);
    expect(firestoreService.storeGames).toHaveBeenCalledWith(mockGames);
  });

  it('should handle errors from NHL API', async () => {
    // Arrange
    mockNhlApiService.fetchRecentGames.mockRejectedValue(new Error('API timeout'));

    // Act & Assert
    await expect(pubsubService.fetchAndStoreNhlScores()).rejects.toThrow('API timeout');
    expect(firestoreService.storeGames).not.toHaveBeenCalled();
  });
});