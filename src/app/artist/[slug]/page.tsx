import { GroundFloorApp } from "../../proof/page";

type ArtistRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ArtistRoute({ params }: ArtistRouteProps) {
  const { slug } = await params;

  return <GroundFloorApp initialArtistSlug={slug} />;
}
