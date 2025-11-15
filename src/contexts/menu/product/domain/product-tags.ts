import { InvalidArgument } from '@/shared/domain/exceptions/invalid-argument.exception'

export class ProductTags {
  private static readonly MAX_TAG_LENGTH = 50
  private static readonly MAX_TAGS = 20

  constructor(private readonly tags: string[]) {
    this.ensureIsValid(tags)
  }

  private ensureIsValid(tags: string[]): void {
    if (tags.length > ProductTags.MAX_TAGS) {
      throw new InvalidArgument(
        `Product cannot have more than ${ProductTags.MAX_TAGS} tags. Got: ${tags.length}`
      )
    }

    tags.forEach(tag => {
      if (tag.trim().length === 0) {
        throw new InvalidArgument('Product tag cannot be empty')
      }

      if (tag.length > ProductTags.MAX_TAG_LENGTH) {
        throw new InvalidArgument(
          `Product tag cannot exceed ${ProductTags.MAX_TAG_LENGTH} characters. Got: ${tag.length}`
        )
      }
    })

    // Check for duplicates
    const uniqueTags = new Set(tags)
    if (uniqueTags.size !== tags.length) {
      throw new InvalidArgument('Product tags cannot contain duplicates')
    }
  }

  static fromArray(tags: string[]): ProductTags {
    return new ProductTags(tags)
  }

  get value(): string[] {
    return [...this.tags]
  }

  add(tag: string): ProductTags {
    if (this.tags.includes(tag)) {
      return this
    }

    return new ProductTags([...this.tags, tag])
  }

  remove(tag: string): ProductTags {
    const filteredTags = this.tags.filter(t => t !== tag)
    return new ProductTags(filteredTags)
  }

  has(tag: string): boolean {
    return this.tags.includes(tag)
  }
}
