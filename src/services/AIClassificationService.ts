/**
 * AI Classification Service using Gemini 3 Flash
 * Classifies maintenance issues as Structural (Landlord) or Usage (Tenant)
 */

export interface ClassificationResult {
  category: 'structural' | 'usage' | 'unclear';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  responsibleParty: 'landlord' | 'tenant' | 'both';
  estimatedCost?: string;
  recommendedAction: string;
  confidence: number;
  tags: string[];
}

export class AIClassificationService {
  private static readonly GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent';
  private static readonly API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  /**
   * Classify maintenance issue from image
   */
  static async classifyMaintenanceIssue(
    imageBase64: string,
    description: string,
    buildingType: string = 'residential'
  ): Promise<ClassificationResult> {
    if (!this.API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are an expert property maintenance classifier for rental properties in Kuwait.

Analyze the provided maintenance issue image and description. Classify the problem as follows:

1. CATEGORY: Is this structural/building damage (landlord responsibility) or user/tenant damage (tenant responsibility)?
2. SEVERITY: Rate severity as low, medium, high, or critical
3. RESPONSIBLE_PARTY: landlord, tenant, or both
4. COST_ESTIMATE: Rough cost estimate in KWD
5. RECOMMENDED_ACTION: What should be done to resolve

Property Type: ${buildingType}
Issue Description: ${description}

Respond in JSON format:
{
  "category": "structural" | "usage" | "unclear",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "brief explanation",
  "responsibleParty": "landlord" | "tenant" | "both",
  "estimatedCost": "cost in KWD",
  "recommendedAction": "action to take",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"]
}`;

    try {
      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.contents[0].parts[0].text;

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        category: result.category,
        severity: result.severity,
        description: result.description,
        responsibleParty: result.responsibleParty,
        estimatedCost: result.estimatedCost,
        recommendedAction: result.recommendedAction,
        confidence: result.confidence,
        tags: result.tags || [],
      };
    } catch (error) {
      console.error('AI Classification error:', error);
      throw error;
    }
  }

  /**
   * Classify multiple images
   */
  static async classifyBatch(
    images: Array<{ base64: string; description: string }>,
    buildingType?: string
  ): Promise<ClassificationResult[]> {
    const results = await Promise.all(
      images.map((img) => this.classifyMaintenanceIssue(img.base64, img.description, buildingType))
    );
    return results;
  }

  /**
   * Get classification history for building
   */
  static async getClassificationHistory(buildingId: string): Promise<ClassificationResult[]> {
    try {
      const response = await fetch(`/api/maintenance/classifications?buildingId=${buildingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classification history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching classification history:', error);
      throw error;
    }
  }

  /**
   * Get classification statistics
   */
  static async getClassificationStats(buildingId: string, period: 'month' | 'year' = 'month') {
    try {
      const response = await fetch(
        `/api/maintenance/classification-stats?buildingId=${buildingId}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export default AIClassificationService;
