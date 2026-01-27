// ZoneWise.AI Enterprise Types

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  artifacts?: Artifact[]
}

export interface Artifact {
  id: string
  type: 'map' | 'table' | 'chart' | 'report' | 'comparison'
  title: string
  data: any
  metadata?: {
    jurisdiction?: string
    zoneCode?: string
    coordinates?: [number, number]
    bounds?: [[number, number], [number, number]]
  }
}

export interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  userId: string
  metadata?: {
    jurisdiction?: string
    queryCount: number
  }
}

export interface ZoningDistrict {
  id: string
  jurisdiction: string
  zoneCode: string
  zoneName: string
  description: string
  setbacks: {
    front: number
    side: number
    rear: number
  }
  maxHeight: number
  maxDensity?: number
  lotSize?: {
    min: number
    max?: number
  }
  coverage?: number
  permittedUses: string[]
  conditionalUses: string[]
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon
}

export interface User {
  id: string
  email: string
  name?: string
  role: 'free' | 'pro' | 'team' | 'enterprise'
  organization?: string
  queryCount: number
  queryLimit: number
  createdAt: Date
}

export interface QueryUsage {
  used: number
  limit: number
  resetDate: Date
}

export type ArtifactViewMode = 'map' | 'data' | 'split'
