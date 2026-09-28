import { redirect } from "next/navigation";

export default async function TableQrRedirect({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  redirect(`/?qrToken=${encodeURIComponent(qrToken)}`);
}
