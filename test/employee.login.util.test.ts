import { __test } from '../pages/api/employee/login'

// happy paths for loopback detection
test('isLoopback: detects IPv4 127.x.x.x', () => {
  expect(__test.isLoopback('127.0.0.1')).toBe(true)
  expect(__test.isLoopback('127.1.2.3')).toBe(true)
})

test('isLoopback: detects IPv6 ::1', () => {
  expect(__test.isLoopback('::1')).toBe(true)
})

test('isLoopback: detects IPv4-mapped ::ffff:127.x.x.x', () => {
  expect(__test.isLoopback('::ffff:127.0.0.1')).toBe(true)
  expect(__test.isLoopback('::FFFF:127.9.9.9')).toBe(true)
})

test('isLoopback: non-loopbacks are false', () => {
  expect(__test.isLoopback('192.168.1.10')).toBe(false)
  expect(__test.isLoopback('::ffff:10.0.0.1')).toBe(false)
  expect(__test.isLoopback('2001:db8::1')).toBe(false)
})

test('validateIpAddress: accepts common IPv4/IPv6 shapes', () => {
  expect(__test.validateIpAddress('192.168.0.5')).toBe(true)
  expect(__test.validateIpAddress('2001:db8::1')).toBe(true)
})

test('validateIpAddress: accepts loopbacks via helper', () => {
  expect(__test.validateIpAddress('127.0.0.1')).toBe(true)
  expect(__test.validateIpAddress('::1')).toBe(true)
  expect(__test.validateIpAddress('::ffff:127.0.0.1')).toBe(true)
})

test('validateIpAddress: rejects bad/empty', () => {
  expect(__test.validateIpAddress(undefined)).toBe(false)
  expect(__test.validateIpAddress('not-an-ip')).toBe(false)
  expect(__test.validateIpAddress('999.999.999.999')).toBe(false)
})
