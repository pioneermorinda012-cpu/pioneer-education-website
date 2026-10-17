import WritingMarker from "@/components/practice/WritingMarker";

export const dynamic = "force-dynamic";

/* The teacher checks one piece of writing. The marker loads it through the
 * teacher API, which refuses anyone without a teacher session. */
export default async function MarkWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="wrap">
      <WritingMarker id={id} />
    </div>
  );
}
