import { PartialType } from '@nestjs/mapped-types';
import { CreateBonusScoreDto } from './create-bonus-score.dto';

export class UpdateBonusScoreDto extends PartialType(CreateBonusScoreDto) {}
