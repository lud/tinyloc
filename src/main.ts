export type ServiceName = string
export type ServiceProvider<C extends Container, S> = (c: C) => S
// type Container<K extends string, T, C extends Empty> = Record<K, T> & C;

export interface Container {
  __defined: ServiceName[],
  self(): this
  get<ServiceName, Service>(key: ServiceName): Service;
  set<K extends ServiceName, Service>(key: ServiceName, provider: ServiceProvider<this, Service>): ServiceContainer<K, Service> & this;
  share<K extends ServiceName, Service>(key: ServiceName, provider: ServiceProvider<this, Service>): ServiceContainer<K, Service> & this;
}

type ServiceContainer<K extends ServiceName, Service> = Record<K, Service>


function single<Service, C extends Container>(provider: ServiceProvider<C, Service>): ServiceProvider<C, Service> {
  let resolved = false
  let value: Service
  return function(proxy: C): Service {
    if (!resolved) {
      value = provider(proxy)
      resolved = true
    }
    return value
  }
}

function getProvider(store, key) {
  if (store.__defined.includes(key)) {
    return store[key]
  }
  throw new Error(`Undefined service '${key}'`)
}

function setProvider(store, key, spec) {
  if ('set' === key || 'share' === key || 'get' === key) {
    throw new Error(`Cannot override function ${key}`)
  }
  if (store.__defined.includes(key)) {
    throw new Error(`Redefinition of service ${key} prevented`)
  }
  store[key] = validateFun(spec)
  store.__defined.push(key)
}

function setSharedProvider(container, key, spec) {
  return setProvider(container, key, single(validateFun(spec)))
}

function validateFun(provider) {
  if (typeof provider !== 'function') {
    throw new Error('Container.set() and .share() 2nd arg must be a function')
  }
  return provider
}

function di(): Container {

  const store: Container = {__defined: []} as Container
  
  const proxy = new Proxy(store, {
    defineProperty(): boolean {
      throw new Error('Defining a property on the container is forbidden')
    },

    // We disallow direct set
    set(): boolean {
      throw new Error('Direct property set is forbidden, please use .set() or .share()')
    },

    get(c, prop: string | number | symbol) {
      switch (prop) {
        case 'get':
          return (key: ServiceName) => {
            const provider = getProvider(c, key)
            return provider(proxy)
          }
        case 'set':
          return (key: ServiceName, provider) => {
            setProvider(c,key, provider)
            return proxy
          }
        case 'share':
          return (key: ServiceName, provider) => {
            setSharedProvider(c, key, provider)
            return proxy
          }
        default:
          // eslint-disable-next-line no-case-declarations
          const provider = getProvider(c, prop as ServiceName)
          return provider(proxy)
      }
    },
  })

  return proxy
}

export default di