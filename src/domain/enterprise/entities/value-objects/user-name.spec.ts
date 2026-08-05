import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'
import { UserName } from './user-name'

describe('UserName', () => {
  it('should accept a valid user name', () => {
    const result = UserName.create('john_doe-1')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.value).toBe('john_doe-1')
      expect(result.value.comparisonKey).toBe('john_doe-1')
    }
  })

  it('should reject user names shorter than the minimum length', () => {
    const result = UserName.create('ab')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
  })

  it('should reject user names longer than the maximum length', () => {
    const result = UserName.create('a'.repeat(31))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
  })

  it('should reject user names with invalid characters', () => {
    for (const invalid of ['john doe', 'john.doe', 'josé', 'user@name']) {
      const result = UserName.create(invalid)

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidUserNameError)
    }
  })

  it('should reject reserved user names regardless of casing', () => {
    const result = UserName.create('Admin')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
  })
})
