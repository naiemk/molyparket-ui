/**
 * DTN (DeepTrustNet) Resolver utility functions
 * Contains system prompts for AI model resolution
 */

/**
 * Combines system prompts with the pool's resolution prompt
 * @param poolResolutionPrompt - The specific resolution prompt from the pool
 * @param systemPrompt1 - The first system prompt from the contract
 * @param systemPrompt2 - The second system prompt from the contract
 * @returns Combined full prompt with system prompts
 */
export function getFullResolutionPrompt(
  poolResolutionPrompt: string, 
  systemPrompt1: string, 
  systemPrompt2: string
): string {
  return `${systemPrompt1}

${poolResolutionPrompt}

${systemPrompt2}`;
}
