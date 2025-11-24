import { Controller, HttpCode, HttpStatus, Logger, Post } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly service: AdminService) {}

  // TODO: Move that to a background job
  // It should be ideally saving progress, so the user can also track it, create a domain and store total batches vs batches processed
  // Return above data through an API so it be visualised
  @Post('backfill')
  @HttpCode(HttpStatus.OK)
  async backfillGames(){
    this.logger.log('Backfill data triggered from admin API')
    try{
    await this.service.backfillLast30Days()
    }
    catch (err){
        throw err;
    }
    return {success: true, message: "Backfilled 30 days!"}
  }



@Post('test-firestore-rules')
@HttpCode(HttpStatus.OK)
async testFirestoreRules() {
  this.logger.log('Testing Firestore write access with Admin SDK');
  
  try {
    // start with test so I can clean it up
    const testGameId = `test-${Date.now()}`;
    const testGame = {
      gameId: testGameId,
      startTime: new Date().toISOString(),
      status: 'TEST',
      homeTeam: {
        id: 999,
        name: 'Test Home Team',
        abbreviation: 'THT',
        score: 3,
        logo: null,
      },
      awayTeam: {
        id: 998,
        name: 'Test Away Team',
        abbreviation: 'TAT',
        score: 2,
        logo: null,
      },
      participatingTeamIds: [999, 998],
      _lastUpdated: new Date().toISOString(),
      _apiVersion: '1.0',
      _testDocument: true, // Adding this field too, for easy deletion
    };

    await this.service.testFirestoreWrite(testGameId, testGame);

    return {
      success: true,
      message: 'Admin SDK successfully wrote to Firestore!',
      gameId: testGameId,
      note: 'This proves Admin SDK bypasses security rules',
    };
  } catch (error) {
    this.logger.error(`Failed to write: ${error.message}`);
    return {
      success: false,
      error: error.message,
      note: 'Admin SDK should NEVER fail with security rules',
    };
  }
}

@Post('cleanup-test-games')
@HttpCode(HttpStatus.OK)
async cleanupTestGames() {
  this.logger.log('Cleaning up test game documents');
  const count = await this.service.cleanupTestGames();
  return {
    success: true,
    message: `Deleted ${count} test games`,
  };
}
}