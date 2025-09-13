import Chat from "@/components/chat";

export default async function SitePostPage(
    props: {
        params: Promise<{ slug: string }>;
    }
) {
    const params = await props.params;
    const slug = params.slug;

    return (
        <Chat slug={slug}/>
    );
}