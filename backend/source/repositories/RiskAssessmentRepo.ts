import database from "../config/database.js";
import type { RiskAssessmentRecord } from "../interfaces/database_types.js";
import type { RiskAssessment } from "../utility_modules/antialt_guard/risk.js";

/**
 * every evaluate() call gets its own row
 */
export const saveAssessment = async (
    assessment: RiskAssessment,
): Promise<void> => {
    await database.query(
        `
        INSERT INTO risk_assessment(
            account_id, score, level, recommended_action, evidence,
            related_account_ids, cluster_size, strongest_fingerprint_score,
            related_banned_account, strong_fingerprint_relationship
        )
        VALUES($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
        `,
        [
            assessment.accountId,
            assessment.score,
            assessment.level,
            assessment.recommendedAction,
            JSON.stringify(assessment.evidence),
            JSON.stringify(assessment.relatedAccountIds),
            assessment.clusterSize,
            assessment.strongestFingerprintScore,
            assessment.relatedBannedAccount,
            assessment.strongFingerprintRelationship,
        ],
    );
};

export const getAssessmentsForAccount = async (
    accountId: string,
    limit = 20,
): Promise<readonly RiskAssessmentRecord[]> => {
    const result = await database.query<RiskAssessmentRecord>(
        `
        SELECT *
        FROM risk_assessment
        WHERE account_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        [accountId, limit],
    );

    return result.rows;
};

/**
 * Latest assessment per account, for accounts whose most recent decision needs a human look.
 */
export const getPendingReview = async (
    limit = 50,
): Promise<readonly RiskAssessmentRecord[]> => {
    const result = await database.query<RiskAssessmentRecord>(
        `
        SELECT DISTINCT ON (account_id) *
        FROM risk_assessment
        WHERE recommended_action IN ('manual_review', 'deny_verification')
        ORDER BY account_id, created_at DESC
        `,
    );

    return [...result.rows]
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, limit);
};
