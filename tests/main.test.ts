import di from '../src/main'

describe('Test basic features', () => {
  
  // Assert if setTimeout was called properly
  it('can set/get services', () => {
    const container = di()
      .set('aString', () => 'hello')
      .set('aNumber', () => Math.random())
      .share('aSharedNumber', () => Math.random())
    
    expect(container.aString).toEqual('hello')

    const number1 = container.aNumber
    const number2 = container.aNumber
    expect(number1).not.toEqual(number2)

    const shared1 = container.aSharedNumber
    const shared2 = container.aSharedNumber
    expect(shared1).toEqual(shared2)
  })

  it('has services types', () => {
    di()
      .set<'aString', string>('aString', () => 'hello')
      .set<'aNumber', number>('aNumber', () => Math.random())
      .set('someService', ({ aString }) => aString.toUpperCase())

    // If code above compiles it is OK
    expect(true).toEqual(true)
  })
})
