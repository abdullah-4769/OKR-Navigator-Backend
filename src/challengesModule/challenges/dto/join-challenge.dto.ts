import { IsString } from "class-validator"

export class JoinChallengeDto {
  @IsString()
  userId: string
}
