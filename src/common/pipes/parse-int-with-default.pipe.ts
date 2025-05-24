import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseIntWithDefaultPipe implements PipeTransform {
  constructor(private readonly defaultValue: number) {}

  transform(value: any, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      return this.defaultValue;
    }
    return val;
  }
}