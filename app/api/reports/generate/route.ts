import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ZoneWise 63 KPI Report API
 * POST /api/reports/generate
 * 
 * Generates a 63 KPI development analysis report for a given parcel
 * 
 * Request body:
 * {
 *   parcelId: string,       // e.g. "28-38-31-54-B-54"
 *   jurisdictionId?: number // optional, defaults to auto-detect
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   reportUrl: string,      // URL to download DOCX
 *   kpiSummary: {
 *     untappedPotential: number,
 *     maxBuildingArea: number,
 *     unusedRights: number
 *   }
 * }
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { parcelId, jurisdictionId } = await request.json();

    if (!parcelId) {
      return NextResponse.json(
        { error: 'parcelId is required' },
        { status: 400 }
      );
    }

    // 1. Get parcel data from Supabase
    const { data: parcelData, error: parcelError } = await supabase
      .from('parcel_zones')
      .select('*, zoning_districts(*)')
      .eq('parcel_id', parcelId.replace(/-/g, ' '))
      .single();

    if (parcelError || !parcelData) {
      return NextResponse.json(
        { error: 'Parcel not found in database', parcelId },
        { status: 404 }
      );
    }

    // 2. Get dimensional standards
    const { data: dimensions } = await supabase
      .from('dimensional_standards')
      .select('*')
      .eq('zoning_district_id', parcelData.zoning_districts?.id)
      .single();

    // 3. Fetch property details from County API (BCPAO for Brevard)
    const taxAccount = parcelData.tax_account;
    let propertyData = null;
    
    if (taxAccount) {
      const bcpaoRes = await fetch(
        `https://www.bcpao.us/api/v1/search?account=${taxAccount}`
      );
      const bcpaoData = await bcpaoRes.json();
      propertyData = bcpaoData[0] || null;
    }

    // 4. Calculate KPIs
    const lotSqFt = (propertyData?.acreage || 1) * 43560;
    const existingBldgArea = propertyData?.totalBaseArea || 0;
    const maxFar = dimensions?.max_far || 0.5;
    const maxBuildingArea = Math.round(lotSqFt * maxFar);
    const unusedRights = maxBuildingArea - existingBldgArea;
    const untappedPotential = ((unusedRights / maxBuildingArea) * 100).toFixed(1);

    // 5. Return summary (full report generation is handled by Modal.com worker)
    return NextResponse.json({
      success: true,
      parcel: {
        id: parcelId,
        zoneCode: parcelData.zone_code,
        zoneName: parcelData.zone_name,
        jurisdiction: parcelData.jurisdiction_id
      },
      property: propertyData ? {
        address: propertyData.siteAddress,
        owner: propertyData.owners,
        acreage: propertyData.acreage,
        marketValue: propertyData.marketValue,
        yearBuilt: propertyData.yearBuilt
      } : null,
      kpiSummary: {
        lotSqFt,
        existingBldgArea,
        maxBuildingArea,
        unusedRights,
        untappedPotential: parseFloat(untappedPotential),
        kpiCount: 63
      },
      reportEndpoint: `/api/reports/download?parcelId=${encodeURIComponent(parcelId)}`,
      dataSource: {
        parcel: 'Supabase parcel_zones',
        zoning: 'Supabase zoning_districts',
        dimensions: 'Supabase dimensional_standards',
        property: 'BCPAO API'
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: String(error) },
      { status: 500 }
    );
  }
}
