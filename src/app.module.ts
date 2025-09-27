import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { RoleModule } from './role/role.module';
import { AppController } from './app.controller';

import { IndustryModule } from './industry/industry.module';
import { UserRoleModule } from './user-role/user-role.module';
import { CreateObjectiveModule } from './create-objective/create-objective.module';
import { CreateKeyResultModule } from './create-key-result/create-key-result.module';
import { ObjectiveEvaluatorModule } from './objective-evaluator/objective-evaluator.module';
import { KeyResultModule } from './key-result/key-result.module';
import { KeywordBaseInnovativeModule } from './keywordbase-innovative/keywordbase-innovative.module';
import { EvaluateInitiativesModule } from './evaluate-initiatives/evaluate-initiatives.module';
import { FinalOkrEvaluationModule } from './final-okr-evaluation/final-okr-evaluation.module';
import { UserModule } from './user/user.module';
import { CreateChallengeModule } from './create-challenge/create-challenge.module';
import { SoloScoreModule } from './solo-score/solo-score.module';
import { SessionModule } from './session/session.module';
import { PrismaService } from './lib/prisma/prisma.service';
import { TeamModule } from './team/team.module';
import { WebsocketModule } from './websocket/websocket.module';
import { TeamMemberRoleModule } from './team-member-role/team-member-role.module';
import { FinalTeamScoreModule } from './final-team-score/final-team-score.module';
import { CampaignSessionModule } from './campaign/campaignsession/campaignsession.module';

import { CampaignModeScoreModule } from './campaign/campaign-mode-score/campaign-mode-score.module';
import { CampaignAwardModule } from './campaign/campaign-award/campaign-award.module';
import { SuggestionEvaluatorModule } from './campaign/suggestion-evaluator-level-1/suggestion-evaluator.module';
import { AiScenarioStrategyModule } from './campaign/certification/ai-scenario-strategy/ai-scenario-strategy.module';
import { CertificationDataModule } from './campaign/certification/certification-data/certification-data.module';
import { FinalCertificationEvaluationModule } from './campaign/certification/final-certification-evaluation/final-certification-evaluation.module';
import { PlansModule } from './plans/plans.module';
import { AuthModule } from './auth/auth.module';
import { ChallengesModule } from "./challengesModule/challenges/challenges.module"

import { TeamSuggestionEvaluatorModule } from './team-evaluation/suggestion-evaluator-level-1/suggestion-evaluator.module';
import { TeamEvaluateInitiativesModule } from './team-evaluation/evaluate-initiatives/evaluate-initiatives.module';
import { TeamFinalOkrEvaluationModule } from './team-evaluation/final-okr-evaluation/final-okr-evaluation.module'; 

@Module({
  imports: [
    GameModule,
    RoleModule,
    IndustryModule,
    CreateObjectiveModule,
    UserRoleModule,
    CreateKeyResultModule,
    ObjectiveEvaluatorModule,
    KeyResultModule,
    KeywordBaseInnovativeModule,
    EvaluateInitiativesModule,
    FinalOkrEvaluationModule,
    UserModule,
    CreateChallengeModule,
    SoloScoreModule,
    SessionModule,
    TeamModule,
    WebsocketModule,
    TeamMemberRoleModule, 
    FinalTeamScoreModule,
    CampaignSessionModule,
    CampaignModeScoreModule,
    CampaignAwardModule,
    SuggestionEvaluatorModule,
    AiScenarioStrategyModule,
    CertificationDataModule,
    FinalCertificationEvaluationModule,
    PlansModule,
    AuthModule,
    TeamSuggestionEvaluatorModule,
    TeamEvaluateInitiativesModule,
    TeamFinalOkrEvaluationModule,
    ChallengesModule
  ],
  controllers: [AppController],
  providers: [PrismaService],
})


export class AppModule { }
