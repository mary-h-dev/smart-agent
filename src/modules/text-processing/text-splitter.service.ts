import { Injectable } from '@nestjs/common';
import {
  TextSplitterParams,
  RecursiveCharacterTextSplitterParams,
} from './text-splitter.interface';

@Injectable()
export class TextSplitterService {
  private readonly defaultSeparators = ['\n\n', '\n', '.', ',', '>', '<', ' ', ''];

  splitText(
    text: string,
    params: Partial<RecursiveCharacterTextSplitterParams> = {},
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

    for (const s of separators) {
      if (s === '' || text.includes(s)) {
        separator = s;
        break;
      }
    }

    const splits = separator ? text.split(separator) : text.split('');
    const goodSplits: string[] = [];

    for (const split of splits) {
      if (split.length < chunkSize) {
        goodSplits.push(split);
      } else {
        if (goodSplits.length) {
          finalChunks.push(...this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap));
          goodSplits.length = 0;
        }
        finalChunks.push(...this.recursiveSplit(split, separators, chunkSize, chunkOverlap));
      }
    }

    if (goodSplits.length) {
      finalChunks.push(...this.mergeSplits(goodSplits, separator, chunkSize, chunkOverlap));
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
        if (currentDoc.length > 0) {
          docs.push(this.joinDocs(currentDoc, separator));
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

    if (currentDoc.length) {
      docs.push(this.joinDocs(currentDoc, separator));
    }

    return docs;
  }

  private joinDocs(docs: string[], separator: string): string {
    return docs.join(separator).trim();
  }
}
