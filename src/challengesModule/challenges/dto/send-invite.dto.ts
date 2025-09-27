import { IsString } from "class-validator"

export class SendInviteDto {
  @IsString()
  playerId: string
}
