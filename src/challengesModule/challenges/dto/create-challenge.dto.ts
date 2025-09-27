import { IsString } from "class-validator"

export class CreateChallengeDto {
  @IsString()
  hostId: string
}
