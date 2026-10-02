import { redirect } from "next/navigation";

export default async function PathologistReviewRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pathologist/reports/${id}`);
}
