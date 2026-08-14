export const dynamic = 'force-dynamic'

import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { parcelIdSchema } from '@/lib/validation'
import { checkProEntitlementForUser } from '@/lib/mcp/entitlement'
import { fetchS5Report } from '@/lib/biddeed-mcp'
import { calcProForma } from '@/lib/feasibility/proforma'
import type { ProFormaInputs, UnitMix } from '@/types/feasibility'

const MCA_ID_RE = /^[A-Za-z0-9.-]{1,64}$/

function requireUserId(ctx: { http?: { authInfo?: { extra?: Record<string, unknown> } } }): string {
  const userId = ctx.http?.authInfo?.extra?.userId
  if (typeof userId !== 'string' || !userId) throw new Error('No authenticated Clerk user on this request')
  return userId
}

function proGateError(tool: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          error: 'pro_entitlement_required',
          tool,
          message: 'This tool requires an active ZoneWise Pro subscription.',
        }),
      },
    ],
    isError: true,
  }
}

const unitMixSchema = z.object({
  type: z.string(),
  pct: z.number(),
  sf: z.number(),
  rent: z.number(),
})

const proFormaInputsSchema = z.object({
  totalUnits: z.number().int().positive(),
  vacancyPct: z.number().min(0).max(100),
  opexPct: z.number().min(0).max(100),
  capRatePct: z.number().min(0).max(100),
  constructionPSF: z.number().positive(),
  softCostPct: z.number().min(0).max(100),
})

const handler = createMcpHandler((server) => {
  server.registerTool(
    'get_parcel_detail',
    {
      description: 'Look up parcel details (address, valuation, auction status) by parcel_id.',
      inputSchema: z.object({ parcel_id: parcelIdSchema }),
    },
    async ({ parcel_id }, ctx) => {
      const userId = requireUserId(ctx)
      if (!(await checkProEntitlementForUser(userId))) return proGateError('get_parcel_detail')

      const supabase = createServiceClient()
      const { data: parcel, error } = await supabase
        .from('fl_parcels')
        .select('parcel_id, phy_addr1, phy_city, phy_zipcd, cent_lat, cent_lon, co_no, dor_uc, jv, tv_nsd, lnd_val, act_yr_blt')
        .eq('parcel_id', parcel_id)
        .single()
      if (error || !parcel) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'Parcel not found' }) }], isError: true }
      }

      const { data: auction } = await supabase
        .from('multi_county_auctions')
        .select('status, auction_type, sale_date, opening_bid, final_judgment_amount')
        .eq('parcel_id', parcel_id)
        .limit(1)
        .maybeSingle()

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ parcel, auction: auction ?? null }),
          },
        ],
      }
    }
  )

  server.registerTool(
    'get_zoning_detail',
    {
      description: 'Get zoning district, standards (FAR/height/setbacks/density), and permitted uses for a parcel.',
      inputSchema: z.object({ parcel_id: parcelIdSchema }),
    },
    async ({ parcel_id }, ctx) => {
      const userId = requireUserId(ctx)
      if (!(await checkProEntitlementForUser(userId))) return proGateError('get_zoning_detail')

      const supabase = createServiceClient()
      const { data: zoning, error } = await supabase
        .from('zoning_assignments')
        .select('zone_code, jurisdiction, far, max_height_ft, max_lot_coverage_pct, max_density_du_acre, front_setback_ft, side_setback_ft, rear_setback_ft')
        .eq('parcel_id', parcel_id)
        .limit(1)
        .maybeSingle()
      if (error || !zoning) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'No zoning assignment found for parcel' }) }], isError: true }
      }

      return { content: [{ type: 'text', text: JSON.stringify({ parcel_id, zoning }) }] }
    }
  )

  server.registerTool(
    'check_feasibility',
    {
      description: 'Run the pro forma feasibility calculation (GPR, NOI, dev cost, profit/margin) for a given unit mix and inputs.',
      inputSchema: z.object({ inputs: proFormaInputsSchema, unit_mix: z.array(unitMixSchema) }),
    },
    async ({ inputs, unit_mix }, ctx) => {
      const userId = requireUserId(ctx)
      if (!(await checkProEntitlementForUser(userId))) return proGateError('check_feasibility')

      const outputs = calcProForma(inputs as ProFormaInputs, unit_mix as UnitMix[])
      return { content: [{ type: 'text', text: JSON.stringify(outputs) }] }
    }
  )

  server.registerTool(
    'get_report',
    {
      description: 'Generate the full S5 zoning/deal report for an auction (by mca_id), same data as the web /report route.',
      inputSchema: z.object({ mca_id: z.string().regex(MCA_ID_RE) }),
    },
    async ({ mca_id }, ctx) => {
      const userId = requireUserId(ctx)
      if (!(await checkProEntitlementForUser(userId))) return proGateError('get_report')

      const result = await fetchS5Report(mca_id)
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: result.error, keySource: result.keySource }) }],
          isError: true,
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data.report) }] }
    }
  )
})

const authHandler = withMcpAuth(
  handler,
  async (_req, token) => {
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
    return verifyClerkToken(clerkAuth, token)
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/mcp',
  }
)

export { authHandler as GET, authHandler as POST }
