import '@testing-library/jest-dom'

global.window = global.window || {}
global.window.api = {
  invoke: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
}

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    store: {},
    path: '/tmp/test-store.json'
  }))
})

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}))

beforeEach(() => {
  jest.clearAllMocks()
})
