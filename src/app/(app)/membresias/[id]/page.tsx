import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Skeleton from "@mui/material/Skeleton";
import { getMembership } from "@/app/(app)/membresias/actions";
import { MembershipDetail } from "@/components/membership/membership-detail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const membership = await getMembership(id);
  if (!membership) notFound();
  return <MembershipDetail membership={membership} />;
}

export default function MembershipPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
      <Detail params={params} />
    </Suspense>
  );
}
