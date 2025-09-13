import Chat from "@/components/chat";
import { getLessonData } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function SitePostPage(
    props: {
        params: Promise<{ slug: string }>;
    }
) {
    const params = await props.params;
    const slug = params.slug;

    const lessonData = await getLessonData(slug);

    if (!lessonData) {
        notFound();
    }

    return (
        <Chat slug={slug} lessonData={lessonData} />
    );
}