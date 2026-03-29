import { redirect } from 'next/navigation';

export default function CompetitorsPage() {
  redirect('/competitors.html');
}

export const metadata = {
  title: 'Competitive Landscape — ZoneWise',
  description: '8-competitor analysis: Gridics, Zoneomics, TestFit, PropertyOnion, Algoma, ArkDesign, Reventure, Foreclosure.com vs ZoneWise/BidDeed.AI',
};

