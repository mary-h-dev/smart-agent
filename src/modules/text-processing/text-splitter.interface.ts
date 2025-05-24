export interface TextSplitterParams {
    chunkSize: number;
    chunkOverlap: number;
  }
  
  export interface RecursiveCharacterTextSplitterParams extends TextSplitterParams {
    separators: string[];
  }
  