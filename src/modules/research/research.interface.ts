export interface ResearchProgress {
    currentDepth: number;
    totalDepth: number;
    currentBreadth: number;
    totalBreadth: number;
    currentQuery?: string;
    totalQueries: number;
    completedQueries: number;
  }
  
  export interface LearningWithSources {
    learning: string;
    sources: string[];
  }
  
  export interface ResearchResult {
    learnings: LearningWithSources[];
    visitedUrls: string[];
  }
  
  export interface EstimationResult {
    depth: number;
    breadth: number;
    reasoning: string;
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    researchScope: string[];
  }
  
  export interface ProfessionalQuestions {
    questions: string[];
    formatted: string;
  }
  