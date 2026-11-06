import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Validates that a string contains at most `max` whitespace-separated words. */
export function MaxWords(max: number, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxWords',
      target: object.constructor,
      propertyName,
      constraints: [max],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return true; // other decorators handle type
          return countWords(value) <= (args.constraints[0] as number);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be ${args.constraints[0]} words or fewer`;
        },
      },
    });
  };
}
