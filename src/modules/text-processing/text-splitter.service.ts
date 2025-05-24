import { Injectable } from '@nestjs/common';
import { 
  TextSplitterParams, 
  RecursiveCharacterTextSplitterParams 
} from './text-splitter.interface';

@Injectable()
export class TextSplitterService {
  private readonly defaultSeparators = ['\n\n', '\n', '.', ',', '>', '<', ' ', ''];

  splitText(
    text: string, 
    params: Partial<RecursiveCharacterTextSplitterParams> = {}
  ): string[] {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      separators = this.defaultSeparators,
    } = params;

    if (chunkOverlap >= chunkSize) {
      throw new Error('Cannot have chunkOverlap >= chunkSize');
    }

    return this.recursiveSplit(text, separators, chunkSize, chunkOverlap);
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const finalChunks: string[] = [];
    let separator = separators[separators.length - 1];

    // Find the appropriate separator
    for (const s of separators) {
      if (s === '') {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        break;
      }
    }

    // Split the text
    const splits = separator ? text.split(separator) : text.split('');
    const goodSplits: string[] = [];

    for (const split of splits) {
      if (split.length < chunkSize) {
        goodSplits.push(split);
      } else {
        if (goodSplits.length) {
          const mergedText = this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap);
          finalChunks.push(...mergedText);
          goodSplits.length = 0;
        }
        const otherInfo = this.recursiveSplit(split, separators, chunkSize, chunkOverlap);
        finalChunks.push(...otherInfo);
      }
    }

    if (goodSplits.length) {
      const mergedText = this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap);
      finalChunks.push(...mergedText);
    }

    return finalChunks;
  }

  private mergeSplits(
    splits: string[],
    separator: string,
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const docs: string[] = [];
    const currentDoc: string[] = [];
    let total = 0;

    for (const d of splits) {
      const len = d.length;
      
      if (total + len >= chunkSize) {
        if (total > chunkSize) {
          console.warn(
            `Created a chunk of size ${total}, which is longer than the specified ${chunkSize}`,
          );
        }
        
        if (currentDoc.length > 0) {
          const doc = this.joinDocs(currentDoc, separator);
          if (doc !== null) {
            docs.push(doc);
          }
          
          while (
            total > chunkOverlap ||
            (total + len > chunkSize && total > 0)
          ) {
            total -= currentDoc[0].length;
            currentDoc.shift();
          }
        }
      }
      
      currentDoc.push(d);
      total += len;
    }
    
    const doc = this.joinDocs(currentDoc, separator);
    if (doc !== null) {
      docs.push(doc);
    }
    
    return docs;
  }

  private joinDocs(docs: string[], separator: string): string | null {
    const text = docs.join(separator).trim();
    return text === '' ? null : text;
  }
}