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

}