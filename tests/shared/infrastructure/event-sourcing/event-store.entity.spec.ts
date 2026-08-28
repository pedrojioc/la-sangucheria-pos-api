import { getMetadataArgsStorage } from 'typeorm'

import { EventStoreEntity } from '@shared/infrastructure/event-sourcing/persistence/event-store.entity'

describe('EventStoreEntity', () => {
  it('no longer carries the uq_event_store_aggregate_version unique constraint', () => {
    const uniques = getMetadataArgsStorage().uniques.filter(
      unique => unique.target === EventStoreEntity
    )

    const legacyUnique = uniques.find(unique => unique.name === 'uq_event_store_aggregate_version')

    expect(legacyUnique).toBeUndefined()
  })

  it('keeps idx_event_store_aggregate_stream as a plain index', () => {
    const indices = getMetadataArgsStorage().indices.filter(
      index => index.target === EventStoreEntity
    )

    const streamIndex = indices.find(index => index.name === 'idx_event_store_aggregate_stream')

    expect(streamIndex).toBeDefined()
    expect(streamIndex?.unique).not.toBe(true)
  })

  it('has a nullable dispatched_at timestamptz column', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      column => column.target === EventStoreEntity
    )

    const dispatchedAt = columns.find(column => column.propertyName === 'dispatchedAt')

    expect(dispatchedAt).toBeDefined()
    expect(dispatchedAt?.options.name).toBe('dispatched_at')
    expect(dispatchedAt?.options.type).toBe('timestamp with time zone')
    expect(dispatchedAt?.options.nullable).toBe(true)
  })

  it('has a partial index on dispatched_at for undispatched rows', () => {
    const indices = getMetadataArgsStorage().indices.filter(
      index => index.target === EventStoreEntity
    )

    const undispatchedIndex = indices.find(index => index.name === 'idx_event_store_undispatched')

    expect(undispatchedIndex).toBeDefined()
    expect(undispatchedIndex?.where).toBe('"dispatched_at" IS NULL')
  })
})
